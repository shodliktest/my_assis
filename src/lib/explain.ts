import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeLesson, type Lesson, type StepType } from "./lesson";

const StepSchema = z.object({
  type: z.enum(["text", "box", "arrow", "highlight", "title"]),
  content: z.string().min(1).max(200),
  x: z.number(),
  y: z.number(),
  x2: z.number().optional(),
  y2: z.number().optional(),
  color: z.string().optional(),
  delay: z.number().optional(),
});

const LessonSchema = z.object({
  explanation: z.string().min(1).max(2500),
  steps: z.array(StepSchema).min(1).max(16),
});

const InputSchema = z.object({
  question: z.string().min(2).max(400),
});

const SYSTEM_PROMPT = `Siz ingliz tili grammatikasi o'qituvchisisiz. Javobni faqat JSON qaytaring — markdown, izoh yoki boshqa matn yo'q.

Til: tushuntirish va doska yozuvlari o'zbek tilida (lotin yozuvida). Inglizcha misollar saqlansin.

JSON shakli:
{
  "explanation": "Ovoqda o'qiladigan 3-6 jumlalik tushuntirish. Markdown yo'q.",
  "steps": [
    {
      "type": "title" | "text" | "box" | "arrow" | "highlight",
      "content": "qisqa yozuv, max 70 belgi",
      "x": 16,
      "y": 10,
      "x2": 40,
      "y2": 30,
      "color": "#1e3a5f",
      "delay": 800
    }
  ]
}

Doska qoidalari:
- 7-12 ta qadam. Birinchi qadam type=title, yuqorida.
- x va y foizda: 8-90. Yuqoridan pastga tartib, elementlar ustma-ust tushmasin. y oralig'i kamida 8.
- box: formulalar, qoidalar.
- highlight: asosiy misollar (inglizcha gap).
- arrow: strelka. x,y boshlanish, x2,y2 oxir. content — qisqa yorliq.
- text: izohlar.
- Ranglar (hex): sarlavha #1e3a5f, qoida #0f6b63, 3-shaxs #1d4ed8, xato #b45309, to'g'ri #15803d, highlight #ca8a04.
- delay: 550-1100.
- Mavzu faqat o'quv savoli bo'lsa javob bering. Boshqa narsa so'ralsa, ingliz tili o'qituvchisi sifatida qisqa yo'naltirib, baribir JSON qaytaring.`;

function getProvider(): { url: string; apiKey: string; model: string } | null {
  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: groq,
      model: "llama-3.3-70b-versatile",
    };
  }
  const xai = process.env.XAI_API_KEY?.trim();
  if (xai) {
    return {
      url: "https://api.x.ai/v1/chat/completions",
      apiKey: xai,
      model: "grok-4.5",
    };
  }
  return null;
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
  if (start < 0 || end <= start) {
    throw new Error("JSON topilmadi");
  }
  return JSON.parse(body.slice(start, end + 1));
}

async function callModel(
  provider: { url: string; apiKey: string; model: string },
  question: string,
  extraUser?: string,
): Promise<string> {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: question },
  ];
  if (extraUser) {
    messages.push({ role: "user", content: extraUser });
  }

  const res = await fetch(provider.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.apiKey}`,
    },
    signal: AbortSignal.timeout(22000),
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.35,
      max_tokens: 1600,
      response_format: { type: "json_object" },
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(friendlyApiError(res.status));
  }

  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return body.choices?.[0]?.message?.content ?? "";
}

export type ExplainResult =
  | { ok: true; lesson: Lesson }
  | { ok: false; error: string };

export const explainQuestion = createServerFn({ method: "POST" })
  .validator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<ExplainResult> => {
    const provider = getProvider();
    if (!provider) {
      return {
        ok: false,
        error:
          "AI hozircha ishlamayapti. GROQ_API_KEY yoki XAI_API_KEY sozlanmagan.",
      };
    }

    const question = data.question.trim();

    try {
      let rawText = await callModel(provider, question);
      let parsed: unknown;
      try {
        parsed = extractJson(rawText);
      } catch {
        rawText = await callModel(
          provider,
          question,
          "Faqat yagona JSON obyekt qaytaring. Boshqa matn yozmang.",
        );
        parsed = extractJson(rawText);
      }

      const lesson = LessonSchema.parse(parsed);
      const normalized = normalizeLesson({
        explanation: lesson.explanation,
        steps: lesson.steps.map((step) => ({
          type: step.type as StepType,
          content: step.content,
          x: step.x,
          y: step.y,
          x2: step.x2,
          y2: step.y2,
          color: step.color ?? "#1e3a5f",
          delay: step.delay ?? 800,
        })),
      });
      return { ok: true, lesson: normalized };
    } catch (err) {
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
