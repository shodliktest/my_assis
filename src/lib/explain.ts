import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  DRAW_KINDS,
  localLessonFor,
  normalizeLesson,
  type AnswerMode,
  type DrawKind,
  type Lesson,
} from "./lesson";

const ItemSchema = z.object({
  id: z.string().optional(),
  kind: z
    .string()
    .default("text")
    .transform((k): DrawKind => (DRAW_KINDS.includes(k as DrawKind) ? (k as DrawKind) : "text")),
  text: z.string().max(220).optional(),
  x: z.number(),
  y: z.number(),
  w: z.number().optional(),
  h: z.number().optional(),
  x2: z.number().optional(),
  y2: z.number().optional(),
  color: z.string().optional(),
  fill: z.string().optional(),
  size: z.enum(["sm", "md", "lg", "xl"]).optional(),
  icon: z.string().max(24).optional(),
  rows: z.array(z.array(z.string().max(48)).max(5)).max(8).optional(),
  chips: z.array(z.string().max(32)).max(12).optional(),
});

const BeatSchema = z.object({
  id: z.string().optional(),
  speech: z.string().min(1).max(900),
  caption: z.string().max(900).optional(),
  items: z.array(ItemSchema).min(1).max(18),
});

const LessonSchema = z.object({
  title: z.string().min(1).max(100),
  beats: z.array(BeatSchema).min(1).max(15),
});

const InputSchema = z.object({
  question: z.string().min(2).max(400),
  mode: z.enum(["short", "full"]).optional(),
});

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "openai/gpt-oss-20b",
] as const;

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

function xaiProvider() {
  const xai = process.env.XAI_API_KEY?.trim();
  if (!xai) return null;
  return {
    url: "https://api.x.ai/v1/chat/completions",
    apiKey: xai,
    model: "grok-4.5",
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

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1]?.trim() ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("JSON topilmadi");
  return JSON.parse(body.slice(start, end + 1));
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

function systemPrompt(mode: AnswerMode): string {
  const visual = `DOSKA QOIDALARI (majburiy — video sifatida):
1) Har bir BLOK = bitta box + ichidagi matnlar. Ichki elementlar BOX ICHIDA.
2) kind: title, box, text, formula, table, chips, number, check, cross, callout, badge, highlight, icon.
   arrow/circle/strike ISHLATMANG (layout buziladi).
3) Koordinatalar FOIZDA 0-100, lekin server baribir qayta joylashtiradi — muhimi TARTIB:
   items tartibi: [title?] → box → shu box ichidagi text/formula/table/chips → keyingi box → ...
4) Har boxdan keyin 2-5 ta ichki element (sarlavha qatori, formula, misol, tarjima).
5) Jadval: kind=table, rows=[["Ustun1","Ustun2"],["qator","qator"]].
6) Ranglar: title/box #1d4ed8 | qoida/formula #0f6b63 | xato #b42318 | ogohlantirish #b45309 | matn #1e3a5f
7) Misol formati: "I am reading. (Men o'qiyapman.)"
8) Ustma-ust yozmang; har yangi box — yangi bo'lim.`;

  if (mode === "short") {
    return `Siz professional o'qituvchisiz. Foydalanuvchi SO'RAGAN HAR QANDAY mavzuni (grammatika, so'z, fan, tushuncha) tushuntirasiz.
Faqat JSON. Til: tushuntirish o'zbekcha (lotin); atamalar/misollar asl tilda.
Rejim QISQA: 3-5 beat. Har beat: 1 box + 3-5 ichki element. Ovoz 1-3 jumla.

Majburiy oqim:
beat1: title + mohiyat box (nima, qachon)
beat2: formula/qoida box + 2 misol
beat3: amaliy misol yoki jadval
beat4 (ixtiyoriy): xato vs to'g'ri

${visual}
JSON: {"title":"...","beats":[{"speech":"...","caption":"...","items":[{"kind":"title","text":"...","x":5,"y":4,"w":90,"color":"#1d4ed8","size":"xl"},{"kind":"box","x":5,"y":12,"w":90,"h":18,"color":"#1d4ed8"},{"kind":"text","text":"...","x":8,"y":14,"w":84,"color":"#1e3a5f","size":"sm"}]}]}`;
  }

  return `Siz professional o'qituvchisiz. HAR QANDAY savol/mavzu: aniq, tushunarli, doskada video sifatida.
Faqat JSON. Til: o'zbekcha tushuntirish; misollar asl tilda (inglizcha bo'lsa inglizcha).
Rejim TO'LIQ: 10-15 beat. Har beat 1 asosiy box + ichki elementlar. Ovoz 2-4 jumla (max 700 belgi).

Majburiy tuzilma (mavzuga moslang):
1) Title + Mohiyat (nima bu?)
2) Asosiy qoida / formula
3) Jadval yoki qadamlar (table yoki number+text)
4) 2-3 ta misol + tarjima
5) Inkor / qarama-qarshi holat (kerak bo'lsa)
6) So'roq yoki qo'llanish
7) Signal so'zlar (chips) yoki eslatma
8) Keng tarqalgan xato: noto'g'ri vs to'g'ri (check/cross)

${visual}
JSON: {"title":"...","beats":[{"speech":"...","caption":"...","items":[...]}]}`;
}

async function callChat(
  url: string,
  apiKey: string,
  model: string,
  mode: AnswerMode,
  question: string,
  extraUser?: string,
): Promise<string> {
  const messages = [
    { role: "system", content: systemPrompt(mode) },
    { role: "user", content: question },
  ];
  if (extraUser) messages.push({ role: "user", content: extraUser });

  const maxTokens = mode === "full" ? 4500 : 2200;
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
    signal: AbortSignal.timeout(mode === "full" ? 45000 : 22000),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new HttpError(res.status, friendlyApiError(res.status));
  const body: unknown = await res.json();
  return messageText(body);
}

async function callWithFailover(
  mode: AnswerMode,
  question: string,
  extraUser?: string,
): Promise<string> {
  const keys = groqKeys();
  let lastErr: unknown;

  for (const key of keys) {
    let skipKey = false;
    for (const model of GROQ_MODELS) {
      try {
        return await callChat(GROQ_URL, key, model, mode, question, extraUser);
      } catch (err) {
        lastErr = err;
        const status = err instanceof HttpError ? err.status : 0;
        if (status === 429 || status === 401 || status === 403) {
          skipKey = true;
          break;
        }
        if (status === 404 || status === 400) continue;
        if (status >= 500) continue;
        if (err instanceof Error && err.name === "TimeoutError") continue;
      }
    }
    if (!skipKey && keys.length === 1) break;
  }

  const xai = xaiProvider();
  if (xai) {
    try {
      return await callChat(xai.url, xai.apiKey, xai.model, mode, question, extraUser);
    } catch (err) {
      lastErr = err;
    }
  }

  if (lastErr instanceof HttpError) throw lastErr;
  if (lastErr instanceof Error && lastErr.name === "TimeoutError") {
    throw new Error("Javob kechikdi. Qayta urinib ko'ring.");
  }
  throw lastErr instanceof Error ? lastErr : new Error(friendlyApiError(500));
}

function toLesson(parsed: unknown): Lesson {
  const lesson = LessonSchema.parse(parsed);
  return normalizeLesson({
    title: lesson.title,
    beats: lesson.beats.map((beat, i) => ({
      id: beat.id || `beat-${i}`,
      speech: beat.speech,
      caption: beat.caption || beat.speech,
      items: beat.items.map((item, j) => ({
        id: item.id || `i-${i}-${j}`,
        kind: item.kind,
        text: item.text,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        x2: item.x2,
        y2: item.y2,
        color: item.color ?? "#1e3a5f",
        fill: item.fill,
        size: item.size,
        icon: item.icon,
        rows: item.rows,
        chips: item.chips,
      })),
    })),
  });
}

export type ExplainResult =
  | { ok: true; lesson: Lesson; mode: AnswerMode }
  | { ok: false; error: string };

export const explainQuestion = createServerFn({ method: "POST" })
  .validator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<ExplainResult> => {
    const mode: AnswerMode = data.mode === "short" ? "short" : "full";
    const local = localLessonFor(data.question);
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

    try {
      let rawText = await callWithFailover(mode, data.question);
      let parsed: unknown;
      try {
        parsed = extractJson(rawText);
      } catch {
        rawText = await callWithFailover(
          mode,
          data.question,
          "Faqat yagona JSON obyekt qaytaring. Markdown yo'q.",
        );
        parsed = extractJson(rawText);
      }
      return { ok: true, lesson: toLesson(parsed), mode };
    } catch (err) {
      if (local) return { ok: true, lesson: local, mode: "short" };
      const known =
        err instanceof Error &&
        (err.message.startsWith("AI xizmati") ||
          err.message.startsWith("So'rovlar") ||
          err.message.startsWith("Server") ||
          err.message.startsWith("Javob"));
      return {
        ok: false,
        error:
          err instanceof Error && err.name === "TimeoutError"
            ? "Javob kechikdi. Qayta urinib ko'ring."
            : known && err instanceof Error
              ? err.message
              : "Javob olinmadi. Birozdan so'ng qayta urinib ko'ring.",
      };
    }
  });
