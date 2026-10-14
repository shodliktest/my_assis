/**
 * Server-only AI lesson generation (Groq primary, xAI optional fallback).
 *
 * Runs inside the Vercel function behind POST /api/explain. Everything is bounded
 * by one wall-clock budget so a slow provider can never push the function past
 * its 60s limit; when the budget is spent the visitor still gets a clear answer
 * (or the built-in local lesson) instead of a 504.
 */
import { localLessonFor, type AnswerMode } from "./lesson.ts";
import { buildSystemPrompt, isEnglishQuestion, needsReasoning } from "./explain-prompt.ts";
import { extractJson, mergeLessons, sanitizeLessonPayload } from "./explain-sanitize.ts";
import { createDeadline, type Deadline } from "./server-guards.ts";
import type { ExplainResult } from "./explain";

/** Must stay below `maxDuration` (60s) in vite.config.ts. */
export const EXPLAIN_BUDGET_MS = 50_000;
const MIN_ATTEMPT_MS = 4_000;
const CALL_CAP_MS: Record<AnswerMode, number> = { full: 28_000, short: 16_000 };
/** Calculations, code and logic puzzles think longer (reasoning_effort "medium"), so allow more time and tokens. */
const REASONING_CAP_MS: Record<AnswerMode, number> = { full: 38_000, short: 24_000 };
// Reasoning tokens count against max_tokens, so the reasoning budget is larger.
const MAX_TOKENS = {
  normal: { full: 4000, short: 2000 },
  // Complete grammar lessons (meaning, all forms, spelling rules, mistakes, practice) are long.
  english: { full: 5200, short: 2200 },
  reasoning: { full: 5500, short: 3500 },
} as const;

/**
 * Groq's free plan allows ~8K tokens per minute per request budget, and a request whose
 * input + requested output is larger than that is refused with 413. The docs do not say
 * whether max_tokens is counted, so we find out instead of guessing: ask for the full
 * budget, and when Groq answers 413 shrink the output to fit and remember the limit.
 * `GROQ_TPM_LIMIT` (e.g. 8000 on the free plan) applies the fit from the first request.
 */
const CHARS_PER_TOKEN = 2.8; // Uzbek + JSON, deliberately pessimistic
const TPM_MARGIN = 250;
const MIN_OUTPUT_TOKENS = 2500;
let learnedTpmLimit: number | undefined;

function envTpmLimit(): number | undefined {
  const n = Number(process.env.GROQ_TPM_LIMIT);
  return Number.isFinite(n) && n >= 3000 ? n : undefined;
}

/** Largest output budget (<= desired) that still fits the per-request token limit. */
export function fitOutputBudget(desired: number, inputTokens: number, limit: number): number {
  const room = limit - inputTokens - 80 - TPM_MARGIN;
  return Math.max(Math.min(desired, MIN_OUTPUT_TOKENS), Math.min(desired, room));
}

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
];

export type ExplainInput = { question: string; mode?: AnswerMode };

/** Validates the request body; null when it is unusable. */
export function parseExplainInput(body: unknown): ExplainInput | null {
  if (typeof body !== "object" || body === null) return null;
  const { question, mode } = body as { question?: unknown; mode?: unknown };
  if (typeof question !== "string") return null;
  const trimmed = question.trim();
  if (trimmed.length < 2 || trimmed.length > 400) return null;
  return { question: trimmed, mode: mode === "short" ? "short" : "full" };
}

class HttpError extends Error {
  status: number;
  /** From the `retry-after` header of a 429 (milliseconds), when the API sent one. */
  retryAfterMs?: number;
  /** From a 413 body: "… Limit 8000, Requested 9300 …". */
  tpm?: { limit: number; requested: number };
  constructor(status: number, message: string, retryAfterMs?: number, tpm?: { limit: number; requested: number }) {
    super(message);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
    this.tpm = tpm;
  }
}

function parseTpm(text: string): { limit: number; requested: number } | undefined {
  const m = /Limit\s+(\d+)[^\d]+(?:Used\s+\d+[^\d]+)?Requested\s+(\d+)/i.exec(text);
  return m ? { limit: Number(m[1]), requested: Number(m[2]) } : undefined;
}

/**
 * Groq's free-plan limits (RPM / TPM / daily tokens) apply per ORGANIZATION and per
 * model, not per key: keys of one account share one budget, keys of different accounts
 * each have their own. So a (key, model) pair that answered 429 is left alone until its
 * `retry-after` has passed, instead of being hammered by every following request.
 */
const DEFAULT_COOLDOWN_MS = 15_000;
const MAX_COOLDOWN_MS = 90_000;
const BAD_KEY_COOLDOWN_MS = 10 * 60_000;
const cooldownUntil = new Map<string, number>();
let keyRotation = 0;

/** Test hook: forget every cooldown and restart the key rotation. */
export function resetFailoverState() {
  cooldownUntil.clear();
  keyRotation = 0;
  learnedTpmLimit = undefined;
}

function cooling(key: string, model: string, now: number): boolean {
  return (cooldownUntil.get(`${key}|${model}`) ?? 0) > now || (cooldownUntil.get(`${key}|*`) ?? 0) > now;
}

function parseRetryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return Math.min(MAX_COOLDOWN_MS, Math.max(1_000, Math.round(seconds * 1000)));
}

function groqKeys(): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  const add = (value: string | undefined) => {
    const t = value?.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    keys.push(t);
  };
  add(process.env.GROQ_API_KEY);
  for (let i = 1; i <= 10; i++) add(process.env[`GROQ_API_KEY${i}`]);
  return keys;
}

/** `GROQ_MODELS=a,b,c` lets you swap models from Vercel without a redeploy of code. */
function groqModels(): string[] {
  const fromEnv = (process.env.GROQ_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return fromEnv.length ? fromEnv : DEFAULT_GROQ_MODELS;
}

function xaiProvider() {
  const xai = process.env.XAI_API_KEY?.trim();
  if (!xai) return null;
  return {
    url: "https://api.x.ai/v1/chat/completions",
    apiKey: xai,
    model: process.env.XAI_MODEL?.trim() || "grok-4.5",
  };
}

function friendlyApiError(status: number): string {
  if (status === 401 || status === 403) {
    return "AI xizmati hozircha javob bera olmayapti. Keyinroq qayta urinib ko'ring.";
  }
  if (status === 429) {
    return "So'rovlar ko'payib ketdi. Bir daqiqadan so'ng qayta urinib ko'ring.";
  }
  if (status >= 500) {
    return "Server band. Birozdan so'ng qayta urinib ko'ring.";
  }
  return "Javob olinmadi. Birozdan so'ng qayta urinib ko'ring.";
}

function messageText(body: unknown): string {
  const msg = (body as { choices?: { message?: { content?: unknown } }[] })
    ?.choices?.[0]?.message;
  const content = msg?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: string }).text ?? "");
        }
        return "";
      })
      .join("");
  }
  return "";
}

type ChatOpts = {
  mode: AnswerMode;
  question: string;
  /** Question needs calculation / code / logic: slower, deeper reasoning. */
  reasoning: boolean;
  extraUser?: string;
  /** Output budget override (set after a 413). */
  maxTokens?: number;
};

type ChatResult = { text: string; truncated: boolean };

function desiredTokens({ mode, question, reasoning }: ChatOpts): number {
  if (reasoning) return MAX_TOKENS.reasoning[mode];
  return (isEnglishQuestion(question) ? MAX_TOKENS.english : MAX_TOKENS.normal)[mode];
}

async function callChat(
  url: string,
  apiKey: string,
  model: string,
  opts: ChatOpts,
  timeoutMs: number,
): Promise<ChatResult> {
  const { mode, question, reasoning, extraUser } = opts;
  const system = buildSystemPrompt(mode, question);
  const messages = [
    { role: "system", content: system },
    { role: "user", content: question },
  ];
  if (extraUser) messages.push({ role: "user", content: extraUser });

  let maxTokens = opts.maxTokens ?? desiredTokens(opts);
  const limit = envTpmLimit() ?? learnedTpmLimit;
  if (limit && opts.maxTokens === undefined && url === GROQ_URL) {
    const inputChars = system.length + question.length + (extraUser?.length ?? 0);
    maxTokens = fitOutputBudget(maxTokens, Math.ceil(inputChars / CHARS_PER_TOKEN), limit);
  }

  const payload: Record<string, unknown> = {
    model,
    temperature: 0.28,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages,
  };
  if (model.startsWith("openai/gpt-oss")) payload.reasoning_effort = reasoning ? "medium" : "low";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const tpm = res.status === 413 ? parseTpm(await res.text().catch(() => "")) : undefined;
    throw new HttpError(
      res.status,
      friendlyApiError(res.status),
      res.status === 429 ? parseRetryAfterMs(res.headers.get("retry-after")) : undefined,
      tpm,
    );
  }
  const body: unknown = await res.json();
  const finish = (body as { choices?: { finish_reason?: unknown }[] })?.choices?.[0]?.finish_reason;
  return { text: messageText(body), truncated: finish === "length" };
}

/**
 * One Groq attempt. A 413 means input + requested output exceed the per-request token
 * limit: shrink the output budget to what fits, remember the limit, and retry right away.
 */
async function callGroq(
  key: string,
  model: string,
  opts: ChatOpts,
  deadline: Deadline,
  timeoutMs: () => number,
): Promise<ChatResult> {
  try {
    return await callChat(GROQ_URL, key, model, opts, timeoutMs());
  } catch (err) {
    if (!(err instanceof HttpError) || err.status !== 413 || deadline.remaining() < MIN_ATTEMPT_MS) throw err;
    const limit = err.tpm?.limit ?? envTpmLimit() ?? 8000;
    const sent = opts.maxTokens ?? desiredTokens(opts);
    const input = err.tpm
      ? Math.max(0, err.tpm.requested - sent)
      : Math.ceil(
          (buildSystemPrompt(opts.mode, opts.question).length + opts.question.length + (opts.extraUser?.length ?? 0)) /
            CHARS_PER_TOKEN,
        );
    const smaller = fitOutputBudget(sent, input, limit);
    if (smaller >= sent) throw err;
    learnedTpmLimit = limit;
    return await callChat(GROQ_URL, key, model, { ...opts, maxTokens: smaller }, timeoutMs());
  }
}

/**
 * Groq first, then xAI. Order: best model first, trying every key on it, and only then
 * the next model (each model has its own limit bucket). Starts on a different key every
 * request so the keys are used evenly. Every attempt gets only the time left in the
 * shared budget.
 */
async function callWithFailover(opts: ChatOpts, deadline: Deadline): Promise<ChatResult> {
  let lastErr: unknown;
  let skipped = false;
  let attempted = false;
  const cap = (opts.reasoning ? REASONING_CAP_MS : CALL_CAP_MS)[opts.mode];
  const attemptTimeout = () => Math.min(cap, deadline.remaining() - 500);

  const all = groqKeys();
  const offset = all.length ? keyRotation++ % all.length : 0;
  const keys = all.map((_, i) => all[(i + offset) % all.length]);

  models: for (const model of groqModels()) {
    for (const key of keys) {
      if (deadline.remaining() < MIN_ATTEMPT_MS) break models;
      if (cooling(key, model, Date.now())) {
        skipped = true;
        continue;
      }
      attempted = true;
      try {
        return await callGroq(key, model, opts, deadline, attemptTimeout);
      } catch (err) {
        lastErr = err;
        const status = err instanceof HttpError ? err.status : 0;
        if (status === 429) {
          // Out of quota for this key+model: park it, try the next key on the same model.
          const wait = err instanceof HttpError ? (err.retryAfterMs ?? DEFAULT_COOLDOWN_MS) : DEFAULT_COOLDOWN_MS;
          cooldownUntil.set(`${key}|${model}`, Date.now() + wait);
          continue;
        }
        if (status === 401 || status === 403) {
          // Bad or revoked key: it will not work for any model.
          cooldownUntil.set(`${key}|*`, Date.now() + BAD_KEY_COOLDOWN_MS);
          continue;
        }
        // Model-level (404/400), server (5xx) or timeout: try the next model.
        continue models;
      }
    }
  }
  // Every key+model pair was parked by earlier 429s and nothing was tried this time.
  if (!attempted && skipped && !lastErr) lastErr = new HttpError(429, friendlyApiError(429));

  const xai = xaiProvider();
  if (xai && deadline.remaining() >= MIN_ATTEMPT_MS) {
    try {
      return await callChat(xai.url, xai.apiKey, xai.model, opts, attemptTimeout());
    } catch (err) {
      lastErr = err;
    }
  }

  if (lastErr instanceof HttpError) throw lastErr;
  if (lastErr instanceof Error && lastErr.name === "TimeoutError") {
    throw new Error("Javob kechikdi. Qayta urinib ko'ring.");
  }
  if (!lastErr) throw new Error("Javob kechikdi. Qayta urinib ko'ring.");
  throw lastErr instanceof Error ? lastErr : new Error(friendlyApiError(500));
}

function tryParseLesson(raw: string) {
  try {
    return sanitizeLessonPayload(extractJson(raw));
  } catch {
    return null;
  }
}

const KNOWN_ERROR_PREFIXES = ["AI xizmati", "So'rovlar", "Server", "Javob"];

/** Shown when the visitor gets the built-in short lesson instead of an AI lesson. */
function fallbackNotice(err: unknown): string {
  const reason =
    err instanceof Error && KNOWN_ERROR_PREFIXES.some((p) => err.message.startsWith(p))
      ? err.message
      : "AI hozir javob bera olmadi.";
  return `${reason} Hozircha tayyor qisqa dars ko'rsatildi; birozdan so'ng qayta so'rang — to'liq dars chiqadi.`;
}

/**
 * The reply hit the token limit and its last beats are missing. Ask once for the remaining
 * sections and append them; on any problem the visitor keeps the beats that did arrive.
 */
async function continueLesson(opts: ChatOpts, first: NonNullable<ReturnType<typeof tryParseLesson>>, deadline: Deadline) {
  if (deadline.remaining() < 15_000) return null;
  const done = first.beats.map((b, i) => `${i + 1}) ${b.caption}`).join("; ");
  try {
    const reply = await callWithFailover(
      {
        ...opts,
        extraUser:
          `Oldingi javob uzunlik chegarasida kesilib qoldi. Yozilgan beatlar: ${done}. ` +
          `Faqat QOLGAN bo'limlarni yangi beatlar sifatida yozing (xuddi shu JSON shakli, title o'sha: "${first.title}"). ` +
          "Yozilganlarni takrorlamang. Oxirgi beat — xulosa.",
      },
      deadline,
    );
    const more = tryParseLesson(reply.text);
    if (!more) return null;
    return { lesson: mergeLessons(first, more), complete: !reply.truncated };
  } catch {
    return null;
  }
}

const CUT_NOTICE =
  "Dars uzunligi chegaraga yetdi, oxirgi bo'limlar yozilmay qoldi. Qolganini alohida so'rang (masalan: «… — imlo qoidalari va xatolar»).";

export async function runExplain(input: ExplainInput): Promise<ExplainResult> {
  const mode: AnswerMode = input.mode === "short" ? "short" : "full";
  const local = localLessonFor(input.question);
  const hasGroq = groqKeys().length > 0;
  const hasXai = !!process.env.XAI_API_KEY?.trim();

  if (!hasGroq && !hasXai) {
    if (local) {
      return {
        ok: true,
        lesson: local,
        mode: "short",
        notice: "AI kaliti ulanmagan, shuning uchun tayyor qisqa dars ko'rsatildi.",
      };
    }
    return {
      ok: false,
      error:
        "Bu savol uchun hozircha AI kaliti ulanmagan. Present Simple yoki Present Continuous ni so'rang.",
    };
  }

  const deadline = createDeadline(EXPLAIN_BUDGET_MS);
  try {
    const opts: ChatOpts = { mode, question: input.question, reasoning: needsReasoning(input.question) };
    const first = await callWithFailover(opts, deadline);
    let lesson = tryParseLesson(first.text);
    let cut = first.truncated;
    // One repair attempt, only when enough of the budget is left to finish it.
    if (!lesson && deadline.remaining() > 8_000) {
      const repaired = await callWithFailover(
        { ...opts, extraUser: "Faqat yagona JSON obyekt qaytaring. Markdown yo'q." },
        deadline,
      );
      lesson = tryParseLesson(repaired.text);
      cut = repaired.truncated;
    }
    if (!lesson) throw new Error("Javob olinmadi. Birozdan so'ng qayta urinib ko'ring.");
    // Cut off by the token limit: its finished beats are kept, the rest is requested separately.
    if (cut && mode === "full") {
      const more = await continueLesson(opts, lesson, deadline);
      if (more) {
        lesson = more.lesson;
        cut = !more.complete;
      }
    }
    return cut && mode === "full"
      ? { ok: true, lesson, mode, notice: CUT_NOTICE }
      : { ok: true, lesson, mode };
  } catch (err) {
    if (local) return { ok: true, lesson: local, mode: "short", notice: fallbackNotice(err) };
    const message =
      err instanceof Error && KNOWN_ERROR_PREFIXES.some((p) => err.message.startsWith(p))
        ? err.message
        : "Javob olinmadi. Birozdan so'ng qayta urinib ko'ring.";
    return { ok: false, error: message };
  }
}
