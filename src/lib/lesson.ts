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
  | "bars";

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
];

export type AnswerMode = "short" | "full";

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
  return lesson.beats.map((b) => b.speech).join(" ");
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
      speech: beat.speech.trim().slice(0, 900),
      caption: (beat.caption || beat.speech).trim().slice(0, 900),
      items: beat.items.slice(0, 8).map((item, ii) => ({
        id: item.id || `i-${bi}-${ii}`,
        kind: kinds.has(item.kind) ? item.kind : "text",
        text: item.text?.slice(0, 220),
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
          ?.slice(0, 8)
          .map((row) => row.slice(0, 5).map((cell) => String(cell).slice(0, 48))),
        chips: item.chips?.slice(0, 12).map((c) => String(c).slice(0, 32)),
      })),
    })),
  };
}

function mapCoord(n: number, full: number) {
  if (n > 100) return n;
  return (n / 100) * full;
}


/** Professional notebook layout: boxes contain children; no overlap; video-like clarity. */
export function stabilizeLessonLayout(lesson: Lesson, pageH: number = PAGE.h): Lesson {
  const PAGE_W = 100;
  const MARGIN_X = 5;
  const BOX_W = 90;
  const INNER_PAD = 2.2;
  const GAP_AFTER_BOX = 2.8;
  const GAP_AFTER_TITLE = 2.0;
  const GAP_LINE = 1.6;

  const estimateH = (item: DrawItem): number => {
    const kind = item.kind;
    if (item.h != null && item.h > 0 && item.h <= 40) return item.h;
    if (kind === "title") return 6.5;
    if (kind === "box") return 12;
    if (kind === "table") {
      const rows = item.rows?.length ?? 3;
      return Math.min(22, 4 + rows * 3.2);
    }
    if (kind === "formula") return 5.5;
    if (kind === "chips") return 6.5;
    if (kind === "callout" || kind === "badge") return 5.5;
    // Diagram kinds are sized in real pixels, then converted to this percent space.
    if (kind === "flow") return (96 / pageH) * 100;
    if (kind === "bars") {
      const n = Math.min(6, Math.max(1, item.rows?.length ?? 3));
      return ((n * 38 + 8) / pageH) * 100;
    }
    if (kind === "icon" || kind === "number") return 5;
    if (kind === "highlight") return 4.5;
    if (kind === "check" || kind === "cross") return 4.5;
    if (kind === "rule" || kind === "strike" || kind === "arrow") return 2.5;
    // text: longer text needs more height
    const len = (item.text ?? "").length;
    if (len > 90) return 7;
    if (len > 50) return 5.5;
    return 4.5;
  };

  const isContainer = (k: DrawKind) => k === "box";
  const isTitle = (k: DrawKind) => k === "title";
  const isSkipLoose = (k: DrawKind) =>
    k === "arrow" || k === "circle" || k === "strike"; // avoid random long lines
  const isContent = (k: DrawKind) =>
    !isContainer(k) && !isTitle(k) && !isSkipLoose(k);

  type Group = { box: DrawItem | null; children: DrawItem[]; titles: DrawItem[] };

  let cursor = 4;
  const outBeats = lesson.beats.map((beat) => {
    const groups: Group[] = [];
    let current: Group = { box: null, children: [], titles: [] };

    const flush = () => {
      if (current.box || current.children.length || current.titles.length) {
        groups.push(current);
      }
      current = { box: null, children: [], titles: [] };
    };

    for (const raw of beat.items) {
      if (isSkipLoose(raw.kind)) continue;
      if (isTitle(raw.kind)) {
        // title before a section
        if (current.box || current.children.length) flush();
        current.titles.push(raw);
        continue;
      }
      if (isContainer(raw.kind)) {
        flush();
        current.box = raw;
        continue;
      }
      if (isContent(raw.kind)) {
        current.children.push(raw);
      }
    }
    flush();

    // If beat has only free children and no box, wrap them in an implicit content column
    const laid: DrawItem[] = [];

    for (const g of groups) {
      // Titles above section
      for (const title of g.titles) {
        const h = estimateH(title);
        laid.push({
          ...title,
          x: MARGIN_X,
          y: cursor,
          w: BOX_W,
          h,
          size: title.size ?? "xl",
        });
        cursor += h + GAP_AFTER_TITLE;
      }

      const children = g.children;
      if (!g.box && children.length === 0) continue;

      // Auto box if we have children without container (keeps nesting rule)
      const boxColor = g.box?.color ?? "#1d4ed8";
      const boxFill =
        g.box?.fill ??
        "color-mix(in oklab, #93c5fd 22%, #fbf7ee)";

      const innerX = MARGIN_X + INNER_PAD;
      const innerW = BOX_W - INNER_PAD * 2;
      let innerCursor = cursor + INNER_PAD + 0.8;
      const childLayouts: DrawItem[] = [];

      for (const child of children) {
        const ch = estimateH(child);
        const kind = child.kind;
        // Nested: always smaller than box width
        let cw = innerW;
        let cx = innerX;
        if (kind === "icon" || kind === "number") {
          cw = Math.min(10, innerW * 0.15);
          cx = innerX;
        } else if (kind === "badge" || kind === "check" || kind === "cross") {
          cw = Math.min(innerW * 0.55, 50);
        } else if (kind === "chips") {
          cw = innerW;
        } else if (kind === "table") {
          cw = innerW;
        } else {
          cw = innerW;
        }

        childLayouts.push({
          ...child,
          x: cx,
          y: innerCursor,
          w: cw,
          h: ch,
          // text inside box slightly smaller feel
          size: child.size ?? (kind === "formula" ? "md" : kind === "title" ? "lg" : "sm"),
        });
        innerCursor += ch + GAP_LINE;
      }

      const boxH = Math.max(
        g.box?.h && g.box.h <= 35 ? g.box.h : 0,
        innerCursor - cursor + INNER_PAD,
        children.length ? 8 : 6,
      );

      // Box first (under children visually via z, but drawn as background)
      laid.push({
        id: g.box?.id ?? `auto-box-${laid.length}`,
        kind: "box",
        x: MARGIN_X,
        y: cursor,
        w: BOX_W,
        h: boxH,
        color: boxColor,
        fill: boxFill,
        text: g.box?.text,
      });
      laid.push(...childLayouts);
      cursor += boxH + GAP_AFTER_BOX;
    }

    // Soft page bound for percent space
    if (cursor > 96) {
      // scale down isn't needed; page height grows in lessonPageSize
    }

    return { ...beat, items: laid.length ? laid : beat.items };
  });

  return { ...lesson, beats: outBeats };
}

/** Convert percent-based AI coords onto the notebook page. */
export function toPageLesson(lesson: Lesson, pageH: number = PAGE.h): Lesson {
  // Hand-authored lessons use pixel coords (e.g. x=40..648). AI uses percent 0-100.
  const looksLikePercent = lesson.beats.some((b) =>
    b.items.some((it) => it.x <= 100 && it.y <= 100),
  );
  // Only reflow AI / percent layouts — never destroy curated pixel lessons (video quality).
  const source = looksLikePercent ? stabilizeLessonLayout(lesson, pageH) : lesson;
  if (!looksLikePercent) return source;
  return {
    ...source,
    beats: source.beats.map((beat) => ({
      ...beat,
      items: beat.items.map((item) => ({
        ...item,
        x: mapCoord(item.x, PAGE.w),
        y: mapCoord(item.y, pageH),
        w: item.w == null ? item.w : item.w > 100 ? item.w : (item.w / 100) * PAGE.w,
        h: item.h == null ? item.h : item.h > 100 ? item.h : (item.h / 100) * pageH,
        x2: item.x2 == null ? item.x2 : mapCoord(item.x2, PAGE.w),
        y2: item.y2 == null ? item.y2 : mapCoord(item.y2, pageH),
      })),
    })),
  };
}

export function lessonPageSize(lesson: Lesson, fallbackH: number = PAGE.h) {
  let maxY = fallbackH;
  for (const beat of lesson.beats) {
    for (const item of beat.items) {
      const extra =
        item.h ??
        (item.kind === "icon" ? 64 : item.kind === "table" ? 120 : 44);
      const bottom = Math.max(item.y + extra, item.y2 ?? 0);
      if (bottom + 90 > maxY) maxY = bottom + 90;
    }
  }
  return { w: PAGE.w, h: Math.min(3400, Math.max(PAGE.h, Math.ceil(maxY))) };
}

