export type DrawKind =
  | "title"
  | "box"
  | "text"
  | "rule"
  | "circle"
  | "arrow"
  | "check"
  | "cross"
  | "badge"
  | "callout"
  | "formula"
  | "table"
  | "icon"
  | "number"
  | "highlight"
  | "chips"
  | "strike"
  | "flow"
  | "bars"
  | "graph"
  | "code"
  | "timeline"
  | "icons";

export const DRAW_KINDS: DrawKind[] = [
  "title",
  "box",
  "text",
  "rule",
  "circle",
  "arrow",
  "check",
  "cross",
  "badge",
  "callout",
  "formula",
  "table",
  "icon",
  "number",
  "highlight",
  "chips",
  "strike",
  "flow",
  "bars",
  "graph",
  "code",
  "timeline",
  "icons",
];

export type AnswerMode = "short" | "full";

/** One plotted curve: `expr` is plain maths in x (see math-expr.ts). */
export type GraphCurve = { expr: string; label?: string; color?: string };
export type GraphPoint = { x: number; y: number; label?: string };

/** A coordinate-plane chart; the client samples the curves, the model never lists values. */
export type GraphSpec = {
  fn: GraphCurve[];
  points: GraphPoint[];
  xmin?: number;
  xmax?: number;
  ymin?: number;
  ymax?: number;
  /** Dashed guides: axis of symmetry, asymptotes. */
  vlines?: number[];
  hlines?: number[];
  /** Join `points` with a polyline (measurements over time). */
  connect?: boolean;
  /** Same scale on both axes (circles, angles). */
  equal?: boolean;
  xlabel?: string;
  ylabel?: string;
};

export type DrawItem = {
  id: string;
  kind: DrawKind;
  text?: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  x2?: number;
  y2?: number;
  color: string;
  fill?: string;
  size?: "sm" | "md" | "lg" | "xl";
  icon?: string;
  rows?: string[][];
  chips?: string[];
  graph?: GraphSpec;
  /** On a box: place its group in the left or right column of a side-by-side block. */
  side?: "left" | "right";
};

export type LessonBeat = {
  id: string;
  speech: string;
  caption: string;
  items: DrawItem[];
};

export type Lesson = {
  title: string;
  beats: LessonBeat[];
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  error?: boolean;
};

export const PAGE = { w: 720, h: 1480 } as const;
import { clampSpeech, displayText } from "./spoken.ts";
import {
  barsMetrics,
  calloutBox,
  chipsBox,
  codeBox,
  flowMetrics,
  formulaBox,
  graphHeight,
  iconsMetrics,
  tableBox,
  textBox,
  timelineMetrics,
  type Box,
} from "./layout-metrics.ts";
export { GRAPH_H } from "./layout-metrics.ts";
export const PAGE_H: Record<AnswerMode, number> = { short: 1480, full: 2480 };

export const SUGGESTED_QUESTIONS = [
  "Present Continuous nima?",
  "Present Simple nima?",
  "Present Simple va Continuous farqi",
  "Past Simple qanday tuziladi?",
] as const;

export const PENCIL_COLORS = [
  { id: "sun", label: "Sariq", body: "#E8B923", wood: "#E2B48A", lead: "#2A241C" },
  { id: "mint", label: "Yashil", body: "#3D9B7A", wood: "#D7B48A", lead: "#1F3D32" },
  { id: "coral", label: "Qizil", body: "#D45B4A", wood: "#E0B089", lead: "#3A1C18" },
  { id: "sky", label: "Ko'k", body: "#3B7CC4", wood: "#E2B48A", lead: "#1B2C44" },
  { id: "ink", label: "Siyoh", body: "#243044", wood: "#D9B48C", lead: "#111827" },
  { id: "sand", label: "Qum", body: "#C9853A", wood: "#E6C09A", lead: "#3F2A12" },
] as const;

export type PencilColorId = (typeof PENCIL_COLORS)[number]["id"];

export function nextPencilColor(id: PencilColorId): PencilColorId {
  const i = PENCIL_COLORS.findIndex((c) => c.id === id);
  return PENCIL_COLORS[(i + 1) % PENCIL_COLORS.length]?.id ?? "sun";
}

export function getPencilColor(id: PencilColorId) {
  return PENCIL_COLORS.find((c) => c.id === id) ?? PENCIL_COLORS[0];
}

const ink = "#1e3a5f";
const muted = "#57534e";
const green = "#0f6b63";
const blue = "#1d4ed8";
const red = "#b42318";
const gold = "#b45309";
const paperBlue = "color-mix(in oklab, #93c5fd 28%, #fbf7ee)";
const paperGreen = "color-mix(in oklab, #6ee7b7 22%, #fbf7ee)";
const paperRed = "color-mix(in oklab, #fca5a5 24%, #fbf7ee)";
const paperGold = "color-mix(in oklab, #fcd34d 28%, #fbf7ee)";
const paperInk = "color-mix(in oklab, #93c5fd 16%, #fbf7ee)";

export const CONTINUOUS_LESSON: Lesson = {
  title: "Present Simple vs Continuous",
  beats: [
    {
      id: "essence",
      speech:
        "Present Continuous bu ayni hozir ko'z oldingizda sodir bo'layotgan jonli harakat. Uning bitta oltin qoidasi bor: to be va fe'lga ing dumi!",
      caption:
        "Present Continuous bu ayni hozir ko'z oldingizda sodir bo'layotgan jonli harakat. Uning bitta oltin qoidasi bor: to be va fe'lga ing dumi!",
      items: [
        {
          id: "t1",
          kind: "title",
          text: "Present Continuous (Hozirgi Davomiy)",
          x: 40,
          y: 28,
          color: blue,
          size: "xl",
        },
        {
          id: "b1",
          kind: "box",
          x: 36,
          y: 92,
          w: 648,
          h: 168,
          color: blue,
          fill: paperBlue,
        },
        {
          id: "b1a",
          kind: "text",
          text: "Mohiyati: Ayni damda davom etayotgan ish-harakat",
          x: 52,
          y: 108,
          color: blue,
          size: "md",
        },
        {
          id: "b1b",
          kind: "text",
          text: "Kalit so'zlar: now (hozir), right now, at the moment",
          x: 52,
          y: 144,
          color: muted,
          size: "sm",
        },
        {
          id: "b1c",
          kind: "text",
          text: "Oltin formula: am / is / are + fe'l-ING",
          x: 52,
          y: 180,
          color: gold,
          size: "md",
        },
      ],
    },
    {
      id: "positive",
      speech:
        "Dastlab darak shakli. Eslab qol: men uchun am, uchinchi shaxs uchun is, ko'plik va sen uchun are ishlatiladi!",
      caption:
        "Dastlab darak shakli. Eslab qol: men uchun am, uchinchi shaxs uchun is, ko'plik va sen uchun are ishlatiladi!",
      items: [
        {
          id: "b2",
          kind: "box",
          x: 36,
          y: 280,
          w: 648,
          h: 268,
          color: green,
          fill: paperGreen,
        },
        {
          id: "b2h",
          kind: "text",
          text: "1. Darak shakli (+)",
          x: 52,
          y: 296,
          color: green,
          size: "lg",
        },
        {
          id: "b2r",
          kind: "rule",
          x: 52,
          y: 336,
          w: 616,
          color: green,
        },
        {
          id: "b2a",
          kind: "text",
          text: "I + AM + verb-ing  →  I am reading a book. (Men kitob o'qiyapman.)",
          x: 52,
          y: 350,
          color: ink,
          size: "sm",
        },
        {
          id: "b2b",
          kind: "text",
          text: "He / She / It + IS + verb-ing  →  She is cooking plov. (U osh pishiryapti.)",
          x: 52,
          y: 392,
          color: ink,
          size: "sm",
        },
        {
          id: "b2c",
          kind: "text",
          text: "We / You / They + ARE + verb-ing",
          x: 52,
          y: 434,
          color: ink,
          size: "sm",
        },
      ],
    },
    {
      id: "negative",
      speech:
        "Inkor ya'ni negativ holatda to be dan keyin shunchaki not qo'shasan. Fe'ldagi ing dumi aslo yo'qolmaydi!",
      caption:
        "Inkor ya'ni negativ holatda to be dan keyin shunchaki not qo'shasan. Fe'ldagi ing dumi aslo yo'qolmaydi!",
      items: [
        {
          id: "b3",
          kind: "box",
          x: 36,
          y: 568,
          w: 648,
          h: 268,
          color: red,
          fill: paperRed,
        },
        {
          id: "b3h",
          kind: "text",
          text: "2. Inkor (Negativ) shakli (−)",
          x: 52,
          y: 584,
          color: red,
          size: "lg",
        },
        {
          id: "b3r",
          kind: "rule",
          x: 52,
          y: 624,
          w: 616,
          color: red,
        },
        {
          id: "b3a",
          kind: "text",
          text: "Formula: am / is / are + NOT + verb-ing",
          x: 52,
          y: 640,
          color: red,
          size: "md",
        },
        {
          id: "b3b",
          kind: "text",
          text: "I am NOT sleeping. (Men uxlamayapman.)",
          x: 52,
          y: 678,
          color: ink,
          size: "sm",
        },
        {
          id: "b3c",
          kind: "text",
          text: "He IS NOT (isn't) working. (U ishlamayapti.)",
          x: 52,
          y: 712,
          color: ink,
          size: "sm",
        },
        {
          id: "b3d",
          kind: "text",
          text: "They ARE NOT (aren't) playing. (Ular o'ynamayapti.)",
          x: 52,
          y: 746,
          color: ink,
          size: "sm",
        },
      ],
    },
    {
      id: "question",
      speech:
        "So'roq gap yasash uchun esa yordamchi to be sakrab gapning eng boshiga chiqadi. Qara, qanday oson!",
      caption:
        "So'roq gap yasash uchun esa yordamchi to be sakrab gapning eng boshiga chiqadi. Qara, qanday oson!",
      items: [
        {
          id: "b4",
          kind: "box",
          x: 36,
          y: 856,
          w: 648,
          h: 248,
          color: ink,
          fill: paperInk,
        },
        {
          id: "b4h",
          kind: "text",
          text: "3. So'roq shakli (?)",
          x: 52,
          y: 872,
          color: ink,
          size: "lg",
        },
        {
          id: "b4r",
          kind: "rule",
          x: 52,
          y: 912,
          w: 616,
          color: ink,
        },
        {
          id: "b4a",
          kind: "text",
          text: "Formula: Am / Is / Are + kim + verb-ing?",
          x: 52,
          y: 928,
          color: ink,
          size: "md",
        },
        {
          id: "b4b",
          kind: "text",
          text: "Are you listening to me? (Meni eshityapsanmi?)",
          x: 52,
          y: 966,
          color: muted,
          size: "sm",
        },
        {
          id: "b4c",
          kind: "text",
          text: "Is he watching TV? (U televizor ko'ryaptimi?)",
          x: 52,
          y: 1000,
          color: muted,
          size: "sm",
        },
        {
          id: "b4d",
          kind: "text",
          text: "→ Yes, he is. / No, he isn't.",
          x: 52,
          y: 1034,
          color: green,
          size: "sm",
        },
      ],
    },
    {
      id: "mistake",
      speech:
        "Ko'pchilik shu yerda adashadi: to be ni aytadi-yu, fe'lga ing qo'shishni unutib I am sleep deb qo'yadi. Ikkisi ham birga bo'lishi shart!",
      caption:
        "Ko'pchilik shu yerda adashadi: to be ni aytadi-yu, fe'lga ing qo'shishni unutib I am sleep deb qo'yadi. Ikkisi ham birga bo'lishi shart!",
      items: [
        {
          id: "b5",
          kind: "box",
          x: 36,
          y: 1124,
          w: 648,
          h: 220,
          color: gold,
          fill: paperGold,
        },
        {
          id: "b5a",
          kind: "text",
          text: "Eng katta xato: I am work  (NOTO'G'RI)",
          x: 52,
          y: 1144,
          color: red,
          size: "md",
        },
        {
          id: "b5b",
          kind: "text",
          text: "To'g'risi: I am working.  (to be + ing doim juft!)",
          x: 52,
          y: 1184,
          color: green,
          size: "md",
        },
        {
          id: "b5c",
          kind: "text",
          text: "Sinab ko'r: «Ular hozir dars qilishmayapti» gapini inglizcha yoz!",
          x: 52,
          y: 1228,
          color: ink,
          size: "sm",
        },
      ],
    },
  ],
};

export const SIMPLE_LESSON: Lesson = {
  title: "Present Simple",
  beats: [
    {
      id: "s1",
      speech:
        "Present Simple — hozirgi oddiy zamon. U doimiy odatlar, umumiy haqiqatlar va muntazam harakatlarni ifodalaydi.",
      caption:
        "Present Simple — hozirgi oddiy zamon. U doimiy odatlar, umumiy haqiqatlar va muntazam harakatlarni ifodalaydi.",
      items: [
        {
          id: "st",
          kind: "title",
          text: "Present Simple (Oddiy Hozirgi Zamon)",
          x: 40,
          y: 28,
          color: ink,
          size: "xl",
        },
        {
          id: "sb",
          kind: "box",
          x: 36,
          y: 96,
          w: 648,
          h: 140,
          color: ink,
          fill: paperInk,
        },
        {
          id: "sba",
          kind: "text",
          text: "Qachon ishlatiladi?",
          x: 52,
          y: 112,
          color: ink,
          size: "lg",
        },
        {
          id: "sbb",
          kind: "text",
          text: "1. Doimiy odatlar  ·  2. Umumiy haqiqat  ·  3. Muntazam ishlar",
          x: 52,
          y: 156,
          color: muted,
          size: "sm",
        },
      ],
    },
    {
      id: "s2",
      speech:
        "I, you, we, they bilan fe'l odatdagi shaklda qoladi. He, she, it bilan esa fe'lga s qo'shiladi.",
      caption:
        "I, you, we, they bilan fe'l odatdagi shaklda qoladi. He, she, it bilan esa fe'lga s qo'shiladi.",
      items: [
        {
          id: "s2b",
          kind: "box",
          x: 36,
          y: 260,
          w: 648,
          h: 220,
          color: green,
          fill: paperGreen,
        },
        {
          id: "s2h",
          kind: "text",
          text: "1. Darak shakli (+)",
          x: 52,
          y: 276,
          color: green,
          size: "lg",
        },
        {
          id: "s2a",
          kind: "text",
          text: "I / You / We / They  +  V    →  They play football.",
          x: 52,
          y: 324,
          color: ink,
          size: "sm",
        },
        {
          id: "s2c",
          kind: "text",
          text: "He / She / It  +  V-s    →  She works every day.",
          x: 52,
          y: 368,
          color: ink,
          size: "sm",
        },
      ],
    },
    {
      id: "s3",
      speech:
        "Inkor va so'roqda yordamchi do, does ishlatiladi. Signal so'zlar: always, usually, every day, never.",
      caption:
        "Inkor va so'roqda yordamchi do, does ishlatiladi. Signal so'zlar: always, usually, every day, never.",
      items: [
        {
          id: "s3b",
          kind: "box",
          x: 36,
          y: 504,
          w: 648,
          h: 200,
          color: red,
          fill: paperRed,
        },
        {
          id: "s3h",
          kind: "text",
          text: "2. Inkor  ·  do / does + not + V",
          x: 52,
          y: 520,
          color: red,
          size: "lg",
        },
        {
          id: "s3a",
          kind: "text",
          text: "I do not (don't) eat meat.   He does not (doesn't) play.",
          x: 52,
          y: 568,
          color: ink,
          size: "sm",
        },
        {
          id: "s3c",
          kind: "text",
          text: "So'roq: Do you live here?  Does she work?",
          x: 52,
          y: 608,
          color: muted,
          size: "sm",
        },
        {
          id: "s4b",
          kind: "box",
          x: 36,
          y: 728,
          w: 648,
          h: 120,
          color: gold,
          fill: paperGold,
        },
        {
          id: "s4a",
          kind: "text",
          text: "Signal so'zlar: always · usually · often · never · every day",
          x: 52,
          y: 768,
          color: gold,
          size: "md",
        },
      ],
    },
  ],
};

export const COMPARE_LESSON: Lesson = {
  title: "Present Simple vs Continuous",
  beats: [
    {
      id: "c1",
      speech:
        "Present Simple odat va faktlar uchun. Present Continuous esa ayni damda davom etayotgan ish uchun. Ikkalasini aralashtirmang!",
      caption:
        "Present Simple odat va faktlar uchun. Present Continuous esa ayni damda davom etayotgan ish uchun. Ikkalasini aralashtirmang!",
      items: [
        {
          id: "ct",
          kind: "title",
          text: "Simple  vs  Continuous",
          x: 40,
          y: 28,
          color: ink,
          size: "xl",
        },
        {
          id: "cl",
          kind: "box",
          x: 36,
          y: 100,
          w: 312,
          h: 280,
          color: green,
          fill: paperGreen,
        },
        {
          id: "clh",
          kind: "text",
          text: "Present Simple",
          x: 52,
          y: 118,
          color: green,
          size: "lg",
        },
        {
          id: "cla",
          kind: "text",
          text: "Odat · fakt · jadval",
          x: 52,
          y: 164,
          color: ink,
          size: "sm",
        },
        {
          id: "clb",
          kind: "text",
          text: "I drink coffee every day.",
          x: 52,
          y: 208,
          color: muted,
          size: "sm",
        },
        {
          id: "clc",
          kind: "text",
          text: "Formula: V / V-s",
          x: 52,
          y: 252,
          color: gold,
          size: "md",
        },
        {
          id: "cr",
          kind: "box",
          x: 372,
          y: 100,
          w: 312,
          h: 280,
          color: blue,
          fill: paperBlue,
        },
        {
          id: "crh",
          kind: "text",
          text: "Present Continuous",
          x: 388,
          y: 118,
          color: blue,
          size: "lg",
        },
        {
          id: "cra",
          kind: "text",
          text: "Ayni hozir · jonli harakat",
          x: 388,
          y: 164,
          color: ink,
          size: "sm",
        },
        {
          id: "crb",
          kind: "text",
          text: "I am drinking coffee now.",
          x: 388,
          y: 208,
          color: muted,
          size: "sm",
        },
        {
          id: "crc",
          kind: "text",
          text: "Formula: be + V-ing",
          x: 388,
          y: 252,
          color: gold,
          size: "md",
        },
      ],
    },
  ],
};

export const DEMO_LESSON = CONTINUOUS_LESSON;

export const EMPTY_LESSON: Lesson = {
  title: "Daftar",
  beats: [],
};

/**
 * Built-in sample lessons, used only when the AI is unavailable AND the question
 * is unmistakably about them. Anything else returns null, so an unrelated
 * question never gets a Present Simple/Continuous lesson as its "answer".
 */
export function localLessonFor(question: string): Lesson | null {
  const q = question.toLowerCase().replace(/[‘’`´ʻʼ]/g, "'").trim();
  // Other tenses (past/future/perfect...) are a different topic.
  if (/\b(past|future|perfect|going to|will)\b|o'tgan|kelasi/.test(q)) return null;

  const continuous = /\bpresent\s+continuous\b|\bcontinuous\b|davomiy|hozirgi\s+davom/.test(q);
  const simple = /\bpresent\s+simple\b|\bsimple\b|oddiy\s+hozirgi/.test(q);

  if (continuous && simple) return COMPARE_LESSON;
  if (continuous) return CONTINUOUS_LESSON;
  if (/\bpresent\s+simple\b|oddiy\s+hozirgi/.test(q)) return SIMPLE_LESSON;
  return null;
}

export function lessonSpeech(lesson: Lesson): string {
  return lesson.beats.map((b) => displayText(b.speech)).join(" ");
}

export function clampCoord(n: number, max = 94) {
  if (!Number.isFinite(n)) return 10;
  return Math.min(max, Math.max(4, n));
}

function isHex(value: string | undefined) {
  return !!value && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}

function clampMaybePercent(n: number, pixelMax: number) {
  if (!Number.isFinite(n)) return 10;
  if (n > 100) return Math.min(pixelMax, Math.max(4, n));
  return clampCoord(n, 96);
}

export function normalizeLesson(raw: Lesson): Lesson {
  const kinds = new Set<string>(DRAW_KINDS);
  return {
    title: raw.title.trim().slice(0, 100) || "Dars",
    beats: raw.beats.slice(0, 14).map((beat, bi) => ({
      id: beat.id || `beat-${bi}`,
      speech: clampSpeech(beat.speech, 900),
      caption: displayText(beat.caption || beat.speech).trim().slice(0, 900),
      items: beat.items.slice(0, 8).map((item, ii) => ({
        id: item.id || `i-${bi}-${ii}`,
        kind: kinds.has(item.kind) ? item.kind : "text",
        text: item.text?.slice(0, item.kind === "code" ? 850 : 220),
        x: clampMaybePercent(item.x, PAGE.w - 8),
        y: clampMaybePercent(item.y, 3200),
        w: item.w,
        h: item.h,
        x2: item.x2 == null ? undefined : clampMaybePercent(item.x2, PAGE.w - 8),
        y2: item.y2 == null ? undefined : clampMaybePercent(item.y2, 3200),
        color: isHex(item.color) ? item.color : "#1e3a5f",
        fill: item.fill,
        size: item.size,
        icon: item.icon?.slice(0, 24),
        rows: item.rows
          ?.slice(0, 10)
          .map((row) => row.slice(0, 5).map((cell) => String(cell).slice(0, 48))),
        chips: item.chips?.slice(0, 12).map((c) => String(c).slice(0, 32)),
        graph: item.kind === "graph" ? item.graph : undefined,
        side: item.kind === "box" && (item.side === "left" || item.side === "right") ? item.side : undefined,
      })),
    })),
  };
}


/** Visuals that need the wider column in a side-by-side block. */
const WIDE_KINDS = new Set<DrawKind>(["graph", "bars", "timeline", "table", "flow", "code"]);
/** Rows that fill the width of their box (bands, tables, charts) rather than hugging their own text. */
const FILL_KINDS = new Set<DrawKind>([
  "formula", "callout", "table", "code", "flow", "icons", "timeline", "bars", "graph", "highlight", "rule",
]);

/**
 * Notebook layout for AI lessons. Coordinates in and out are pixels on the
 * 720-wide page; the AI's own x/y/w/h are ignored.
 *
 * - Elements inside a `box` stack top to bottom. Each is measured from its content
 *   (layout-metrics.ts, real font widths in the browser) and the box is only as
 *   wide and as tall as its content needs.
 * - Consecutive boxes marked `side:"left"` / `side:"right"` are laid side by side
 *   (chart left, notes right).
 * - Beats follow each other down the page. There is no height limit: the board
 *   simply grows (see lessonPageSize).
 */
export function stabilizeLessonLayout(lesson: Lesson, _pageH?: number): Lesson {
  const MARGIN = 36;
  const FULL_W = 648;
  const PAD = 16;
  const MIN_BOX_W = 120;
  const COL_GAP = 20;
  const GAP_LINE = 10;
  const GAP_BOX = 22;
  const GAP_TITLE = 12;

  type Group = { box: DrawItem | null; children: DrawItem[]; titles: DrawItem[] };
  let autoBoxes = 0;

  const measure = (item: DrawItem, maxW: number): Box => {
    switch (item.kind) {
      case "formula":
        return formulaBox(item.text, maxW);
      case "callout":
        return calloutBox(item.text, maxW);
      case "chips":
        return chipsBox(item.chips ?? (item.text ?? "").split("·").map((c) => c.trim()), maxW);
      case "table":
        return tableBox(item.rows, maxW);
      case "flow":
        return { w: maxW, h: flowMetrics(item.chips?.length ?? 3, maxW).h };
      case "bars":
        return { w: maxW, h: barsMetrics(item.rows, maxW).h };
      case "graph":
        return { w: maxW, h: graphHeight(maxW) };
      case "code":
        return codeBox(item.text, maxW);
      case "timeline":
        return { w: maxW, h: timelineMetrics(item.rows, maxW).h };
      case "icons":
        return { w: maxW, h: iconsMetrics(item.rows, maxW, item.text === "→").h };
      case "icon":
        return { w: 56, h: 64 };
      case "number":
        return { w: 40, h: 48 };
      case "badge":
      case "check":
      case "cross":
        return { w: Math.min(maxW * 0.55, 360), h: 36 };
      case "highlight":
        return { w: maxW, h: 28 };
      case "rule":
        return { w: maxW, h: 8 };
      default:
        return textBox(item.text, item.size, maxW);
    }
  };

  const placeGroup = (g: Group, colX: number, colW: number, y0: number) => {
    const innerMax = colW - PAD * 2;
    const measured = g.children.map((child) => ({ child, ...measure(child, innerMax) }));
    const contentW = Math.max(0, ...measured.map((m) => m.w));
    // The box is only as wide as its widest row (never wider than its column).
    const boxW = Math.max(MIN_BOX_W, Math.min(colW, Math.ceil(contentW + PAD * 2 + 6)));
    const innerW = boxW - PAD * 2;
    const innerX = colX + PAD;

    let y = y0 + PAD;
    const rows: DrawItem[] = [];
    for (const m of measured) {
      const w = FILL_KINDS.has(m.child.kind) ? innerW : Math.min(m.w, innerW);
      rows.push({
        ...m.child,
        x: innerX,
        y,
        w,
        h: m.h,
        size: m.child.size ?? (m.child.kind === "formula" ? "md" : "sm"),
      });
      y += m.h + GAP_LINE;
    }
    const boxH = Math.max(measured.length ? y - GAP_LINE + PAD - y0 : 0, 48);
    const box: DrawItem = {
      id: g.box?.id ?? `auto-box-${autoBoxes++}`,
      kind: "box",
      x: colX,
      y: y0,
      w: boxW,
      h: boxH,
      color: g.box?.color ?? "#1d4ed8",
      fill: g.box?.fill ?? "color-mix(in oklab, #93c5fd 22%, #fbf7ee)",
      text: g.box?.text,
    };
    return { items: [box, ...rows], bottom: y0 + boxH, width: boxW };
  };

  let cursor = 28;
  const beats = lesson.beats.map((beat) => {
    const groups: Group[] = [];
    let current: Group = { box: null, children: [], titles: [] };
    const flush = () => {
      if (current.box || current.children.length || current.titles.length) groups.push(current);
      current = { box: null, children: [], titles: [] };
    };

    for (const raw of beat.items) {
      // Free-floating arrows, circles and strikes cannot be placed reliably from text coordinates.
      if (raw.kind === "arrow" || raw.kind === "circle" || raw.kind === "strike") continue;
      if (raw.kind === "title") {
        if (current.box || current.children.length) flush();
        current.titles.push(raw);
      } else if (raw.kind === "box") {
        flush();
        current.box = raw;
      } else {
        current.children.push(raw);
      }
    }
    flush();

    const laid: DrawItem[] = [];
    let i = 0;
    while (i < groups.length) {
      const g = groups[i];
      for (const title of g.titles) {
        const size = title.size ?? "lg";
        const h = textBox(title.text, size, FULL_W, 600).h;
        laid.push({ ...title, x: MARGIN, y: cursor, w: FULL_W, h, size });
        cursor += h + GAP_TITLE;
      }
      if (!g.box && !g.children.length) {
        i++;
        continue;
      }

      const side = g.box?.side;
      if (!side) {
        const r = placeGroup(g, MARGIN, FULL_W, cursor);
        laid.push(...r.items);
        cursor = r.bottom + GAP_BOX;
        i++;
        continue;
      }

      // A side-by-side block: consecutive sided groups (a new title ends it).
      const block = [g];
      let j = i + 1;
      while (j < groups.length && groups[j].box?.side && groups[j].titles.length === 0) {
        block.push(groups[j++]);
      }
      i = j;
      const left = block.filter((b) => b.box?.side === "left");
      const right = block.filter((b) => b.box?.side === "right");

      if (!left.length || !right.length) {
        // Only one side present: nothing to put it beside, so give it the full width.
        for (const b of block) {
          const r = placeGroup(b, MARGIN, FULL_W, cursor);
          laid.push(...r.items);
          cursor = r.bottom + GAP_BOX;
        }
        continue;
      }

      const wide = left.some((b) => b.children.some((c) => WIDE_KINDS.has(c.kind)));
      const leftAlloc = wide ? 372 : (FULL_W - COL_GAP) / 2;
      let yl = cursor;
      let leftUsed = 0;
      for (const b of left) {
        const r = placeGroup(b, MARGIN, leftAlloc, yl);
        laid.push(...r.items);
        yl = r.bottom + GAP_BOX;
        leftUsed = Math.max(leftUsed, r.width);
      }
      // The right column starts where the left one actually ends and takes the rest.
      const rightX = MARGIN + leftUsed + COL_GAP;
      const rightW = MARGIN + FULL_W - rightX;
      let yr = cursor;
      for (const b of right) {
        const r = placeGroup(b, rightX, rightW, yr);
        laid.push(...r.items);
        yr = r.bottom + GAP_BOX;
      }
      cursor = Math.max(yl, yr);
    }

    return { ...beat, items: laid.length ? laid : beat.items };
  });

  return { ...lesson, beats };
}

/**
 * Puts a lesson on the notebook page. AI lessons (coordinates 0-100 or absent) are
 * laid out by stabilizeLessonLayout, which returns pixels; hand-authored lessons
 * already use pixel coordinates and pass through untouched.
 */
export function toPageLesson(lesson: Lesson, pageH: number = PAGE.h): Lesson {
  const looksLikePercent = lesson.beats.some((b) =>
    b.items.some((it) => it.x <= 100 && it.y <= 100),
  );
  return looksLikePercent ? stabilizeLessonLayout(lesson, pageH) : lesson;
}

/** Lowest drawn pixel of a lesson. */
export function lessonBottom(lesson: Lesson): number {
  let bottom = 0;
  for (const beat of lesson.beats) {
    for (const item of beat.items) {
      bottom = Math.max(bottom, item.y + (item.h ?? 44), item.y2 ?? 0);
    }
  }
  return bottom;
}

/** Highest drawn pixel of a lesson. */
function lessonTop(lesson: Lesson): number {
  let top = Number.POSITIVE_INFINITY;
  for (const beat of lesson.beats) for (const item of beat.items) top = Math.min(top, item.y);
  return Number.isFinite(top) ? top : 0;
}

/**
 * Board size that fits the content. The board has no height ceiling: it grows with
 * the lessons on it. (200000px is only a guard against a corrupt value.)
 */
export function lessonPageSize(lesson: Lesson, _fallbackH?: number) {
  const extra = lesson.beats.some((b) => b.items.some((i) => i.kind === "table" && i.h == null)) ? 120 : 0;
  return { w: PAGE.w, h: Math.min(200_000, Math.max(1000, Math.ceil(lessonBottom(lesson) + 120 + extra))) };
}

/**
 * Continues a board: `addition` (already laid out from the top of its own page)
 * is moved below everything on `base`, and its ids are made unique, so a follow-up
 * question never writes over earlier work. Pure.
 */
export function appendLesson(base: Lesson, addition: Lesson, gap = 72): Lesson {
  if (!base.beats.length) return addition;
  const dy = lessonBottom(base) + gap - lessonTop(addition);
  const tag = `q${base.beats.length}-`;
  const shift = (it: DrawItem): DrawItem => ({
    ...it,
    id: `${tag}${it.id}`,
    y: it.y + dy,
    y2: it.y2 == null ? undefined : it.y2 + dy,
  });
  return {
    ...base,
    beats: [
      ...base.beats,
      ...addition.beats.map((b) => ({ ...b, id: `${tag}${b.id}`, items: b.items.map(shift) })),
    ],
  };
}
