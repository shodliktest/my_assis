export type StepType = "text" | "box" | "arrow" | "highlight" | "title";

export type BoardStep = {
  type: StepType;
  content: string;
  x: number;
  y: number;
  x2?: number;
  y2?: number;
  color: string;
  delay: number;
};

export type Lesson = {
  explanation: string;
  steps: BoardStep[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
};

export const SUGGESTED_QUESTIONS = [
  "Sen nimalar qila olasan?",
  "Present Simple nima?",
  "Present Simple va Continuous farqi",
  "Past Simple qanday tuziladi?",
] as const;

export const DEMO_QUESTION = "Sen nimalar qila olasan, qanday usuldan foydalansan?";

export const DEMO_LESSON: Lesson = {
  explanation:
    "Men interaktiv o'quv doskasiman. Savolingizni o'zbekcha tushuntiraman, doskada bosqichma-bosqich chizaman va xohlasangiz ovozda aytaman. Ingliz tili grammatikasi, so'zlar, misollar — savol bering, men yozib, chizib, tushuntiraman.",
  steps: [
    {
      type: "title",
      content: "Daftar nima qila oladi?",
      x: 14,
      y: 8,
      color: "#1e3a5f",
      delay: 350,
    },
    {
      type: "box",
      content: "1. Savolingizni o'zbekcha tushuntiradi",
      x: 12,
      y: 22,
      color: "#0f6b63",
      delay: 700,
    },
    {
      type: "box",
      content: "2. Doskada bosqichma-bosqich chizadi",
      x: 12,
      y: 36,
      color: "#1d4ed8",
      delay: 700,
    },
    {
      type: "box",
      content: "3. Ovozda o'qib beradi (ixtiyoriy)",
      x: 12,
      y: 50,
      color: "#b45309",
      delay: 700,
    },
    {
      type: "text",
      content: "Qanday usul?",
      x: 14,
      y: 64,
      color: "#44403c",
      delay: 600,
    },
    {
      type: "highlight",
      content: "AI + interaktiv doska + nutq",
      x: 14,
      y: 74,
      color: "#0f6b63",
      delay: 750,
    },
    {
      type: "text",
      content: "Masalan: «Present Simple nima?» deb so'rang",
      x: 14,
      y: 86,
      color: "#57534e",
      delay: 700,
    },
  ],
};

export function clampCoord(n: number) {
  if (!Number.isFinite(n)) return 10;
  return Math.min(94, Math.max(4, n));
}

export function normalizeLesson(raw: Lesson): Lesson {
  return {
    explanation: raw.explanation.trim(),
    steps: raw.steps.slice(0, 14).map((step) => ({
      type: step.type,
      content: step.content.slice(0, 120),
      x: clampCoord(step.x),
      y: clampCoord(step.y),
      x2: step.x2 == null ? undefined : clampCoord(step.x2),
      y2: step.y2 == null ? undefined : clampCoord(step.y2),
      color: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(step.color)
        ? step.color
        : "#1e3a5f",
      delay: Math.min(1800, Math.max(280, step.delay || 800)),
    })),
  };
}
