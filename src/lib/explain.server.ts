/**
 * Server-only AI lesson generation (Groq primary, xAI optional fallback).
 *
 * Runs inside the Vercel function behind POST /api/explain. Everything is bounded
 * by one wall-clock budget so a slow provider can never push the function past
 * its 60s limit; when the budget is spent the visitor still gets a clear answer
 * (or the built-in local lesson) instead of a 504.
 */
import { localLessonFor, type AnswerMode } from "./lesson.ts";
import { buildSystemPrompt } from "./explain-prompt.ts";
import { extractJson, sanitizeLessonPayload } from "./explain-sanitize.ts";
import { createDeadline, type Deadline } from "./server-guards.ts";
import type { ExplainResult } from "./explain";

/** Must stay below `maxDuration` (60s) in vite.config.ts. */
export const EXPLAIN_BUDGET_MS = 50_000;
const MIN_ATTEMPT_MS = 4_000;
const CALL_CAP_MS: Record<AnswerMode, number> = { full: 28_000, short: 16_000 };

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
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
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

async function callChat(
  url: string,
  apiKey: string,
  model: string,
  mode: AnswerMode,
  question: string,
  timeoutMs: number,
  extraUser?: string,
): Promise<string> {
  const messages = [
    { role: "system", content: buildSystemPrompt(mode) },
    { role: "user", content: question },
  ];
  if (extraUser) messages.push({ role: "user", content: extraUser });

  // Output is compact (no coordinates); the cap leaves headroom under Groq's per-minute token limit.
  const maxTokens = mode === "full" ? 4000 : 2000;
  const payload: Record<string, unknown> = {
    model,
    temperature: 0.28,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages,
  };
  if (model.startsWith("openai/gpt-oss")) payload.reasoning_effort = "low";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new HttpError(res.status, friendlyApiError(res.status));
  const body: unknown = await res.json();
  return messageText(body);
}

/**
 * Groq keys x models first (a 401/403/429 retires that key), then xAI.
 * Every attempt gets only the time that is left in the shared budget.
 */
async function callWithFailover(
  mode: AnswerMode,
  question: string,
  deadline: Deadline,
  extraUser?: string,
): Promise<string> {
  let lastErr: unknown;
  const attemptTimeout = () => Math.min(CALL_CAP_MS[mode], deadline.remaining() - 500);

  keys: for (const key of groqKeys()) {
    for (const model of groqModels()) {
      if (deadline.remaining() < MIN_ATTEMPT_MS) break keys;
      try {
        return await callChat(GROQ_URL, key, model, mode, question, attemptTimeout(), extraUser);
      } catch (err) {
        lastErr = err;
        const status = err instanceof HttpError ? err.status : 0;
        // Key-level problem: try the next key rather than the next model.
        if (status === 429 || status === 401 || status === 403) continue keys;
        // Model-level (404/400), server (5xx) or timeout: try the next model.
      }
    }
  }

  const xai = xaiProvider();
  if (xai && deadline.remaining() >= MIN_ATTEMPT_MS) {
    try {
      return await callChat(xai.url, xai.apiKey, xai.model, mode, question, attemptTimeout(), extraUser);
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

export async function runExplain(input: ExplainInput): Promise<ExplainResult> {
  const mode: AnswerMode = input.mode === "short" ? "short" : "full";
  const local = localLessonFor(input.question);
  const hasGroq = groqKeys().length > 0;
  const hasXai = !!process.env.XAI_API_KEY?.trim();

  if (!hasGroq && !hasXai) {
    if (local) return { ok: true, lesson: local, mode: "short" };
    return {
      ok: false,
      error:
        "Bu savol uchun hozircha AI kaliti ulanmagan. Present Simple yoki Present Continuous ni so'rang.",
    };
  }

  const deadline = createDeadline(EXPLAIN_BUDGET_MS);
  try {
    let lesson = tryParseLesson(await callWithFailover(mode, input.question, deadline));
    // One repair attempt, only when enough of the budget is left to finish it.
    if (!lesson && deadline.remaining() > 8_000) {
      lesson = tryParseLesson(
        await callWithFailover(
          mode,
          input.question,
          deadline,
          "Faqat yagona JSON obyekt qaytaring. Markdown yo'q.",
        ),
      );
    }
    if (!lesson) throw new Error("Javob olinmadi. Birozdan so'ng qayta urinib ko'ring.");
    return { ok: true, lesson, mode };
  } catch (err) {
    if (local) return { ok: true, lesson: local, mode: "short" };
    const message =
      err instanceof Error && KNOWN_ERROR_PREFIXES.some((p) => err.message.startsWith(p))
        ? err.message
        : "Javob olinmadi. Birozdan so'ng qayta urinib ko'ring.";
    return { ok: false, error: message };
  }
}
