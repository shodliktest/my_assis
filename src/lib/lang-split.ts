export type SpeechLang = "uz" | "en";

export type SpeechPart = {
  lang: SpeechLang;
  text: string;
};

const EN_WORDS = new Set(
  [
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "my",
    "your",
    "his",
    "her",
    "our",
    "their",
    "am",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "do",
    "does",
    "did",
    "done",
    "have",
    "has",
    "had",
    "will",
    "would",
    "can",
    "could",
    "shall",
    "should",
    "may",
    "might",
    "must",
    "the",
    "a",
    "an",
    "to",
    "of",
    "in",
    "on",
    "at",
    "for",
    "with",
    "from",
    "by",
    "as",
    "and",
    "or",
    "but",
    "not",
    "no",
    "yes",
    "this",
    "that",
    "these",
    "those",
    "now",
    "then",
    "here",
    "there",
    "what",
    "when",
    "where",
    "who",
    "why",
    "how",
    "if",
    "so",
    "too",
    "very",
    "just",
    "only",
    "also",
    "about",
    "into",
    "over",
    "after",
    "before",
    "every",
    "each",
    "some",
    "any",
    "all",
    "day",
    "week",
    "month",
    "year",
    "time",
    "moment",
    "right",
    "always",
    "usually",
    "often",
    "sometimes",
    "never",
    "already",
    "yet",
    "still",
    "today",
    "tonight",
    "tomorrow",
    "yesterday",
    "present",
    "past",
    "future",
    "simple",
    "continuous",
    "progressive",
    "perfect",
    "passive",
    "active",
    "tense",
    "verb",
    "noun",
    "adjective",
    "adverb",
    "subject",
    "object",
    "article",
    "formula",
    "ing",
    "ed",
    "don't",
    "doesn't",
    "isn't",
    "aren't",
    "wasn't",
    "weren't",
    "haven't",
    "hasn't",
    "won't",
    "can't",
    "reading",
    "writing",
    "playing",
    "working",
    "cooking",
    "watching",
    "listening",
    "sleeping",
    "going",
    "coming",
    "doing",
    "making",
    "taking",
    "eating",
    "drinking",
    "living",
    "study",
    "studies",
    "studying",
    "play",
    "plays",
    "work",
    "works",
    "live",
    "lives",
    "go",
    "goes",
    "eat",
    "eats",
    "drink",
    "drinks",
    "watch",
    "watches",
    "read",
    "reads",
    "write",
    "writes",
    "sleep",
    "book",
    "tv",
    "football",
    "coffee",
    "tea",
    "home",
    "school",
    "english",
    "grammar",
    "example",
    "question",
    "answer",
    "positive",
    "negative",
    "while",
    "during",
    "currently",
    "look",
    "looks",
    "looking",
    "listen",
    "listens",
    "speak",
    "speaks",
    "speaking",
    "learn",
    "learns",
    "learning",
    "use",
    "uses",
    "used",
    "using",
    "form",
    "forms",
    "sentence",
    "word",
    "words",
    "signal",
    "keywords",
    "key",
    "plus",
    "minus",
  ].map((w) => w.toLowerCase()),
);

const UZ_WORDS = new Set(
  [
    "va",
    "bu",
    "yu",
    "ham",
    "uchun",
    "bilan",
    "yoki",
    "lekin",
    "agar",
    "deb",
    "edi",
    "ekan",
    "nima",
    "qanday",
    "qachon",
    "qayerda",
    "qayer",
    "men",
    "sen",
    "u",
    "biz",
    "siz",
    "ular",
    "shu",
    "endi",
    "hozir",
    "doim",
    "odatda",
    "har",
    "emas",
    "yo'q",
    "ha",
    "kerak",
    "mumkin",
    "demak",
    "masalan",
    "ya'ni",
    "yani",
    "chunki",
    "qoida",
    "shakl",
    "darak",
    "inkor",
    "so'roq",
    "soroq",
    "zamon",
    "odat",
    "harakat",
    "misol",
    "misollar",
    "xato",
    "to'g'ri",
    "togri",
    "noto'g'ri",
    "notogri",
    "eslab",
    "qol",
    "qara",
    "oson",
    "oltin",
    "kalit",
    "so'zlar",
    "sozlar",
    "gap",
    "gaplar",
    "fe'l",
    "fel",
    "yordamchi",
    "ishlatiladi",
    "ifodalaydi",
    "tuziladi",
    "qo'shiladi",
    "qoshiladi",
    "ayni",
    "damda",
    "davom",
    "etayotgan",
    "bo'layotgan",
    "bolayotgan",
    "o'qiyapman",
    "oqiyapman",
    "kitob",
    "dars",
    "daftar",
    "o'quvchi",
    "o'qituvchi",
    "ingliz",
    "o'zbek",
    "ozbek",
    "tili",
    "grammatikasi",
    "farqi",
    "farq",
    "formulasi",
    "shunchaki",
    "aslo",
    "yo'qolmaydi",
    "sakrab",
    "boshiga",
    "chiqadi",
    "ko'pchilik",
    "adashadi",
    "unutib",
    "ikkisi",
    "birga",
    "bo'lishi",
    "shart",
    "sinab",
    "ko'r",
    "yoz",
    "tushuntiraman",
    "qarang",
    "esda",
    "tut",
    "mana",
    "quyidagi",
    "kabi",
    "bo'ladi",
    "qiladi",
    "qilish",
    "ish",
    "hali",
    "allaqachon",
    "hech",
    "muntazam",
    "umumiy",
    "haqiqat",
    "fakt",
    "jadval",
    "odatlar",
    "jonli",
    "ko'z",
    "oldingizda",
    "sodir",
  ].map((w) => w.toLowerCase()),
);

const EN_MORPH =
  /(?:ing|ed|tion|ness|ment|ous|ive|able|ible|ful|less|ly|ers?|est|n't|ies)$/i;

function stripWord(raw: string): string {
  return raw.replace(
    /^[^A-Za-zÀ-ÿOʻGʻoʻgʻʻʼ'’-]+|[^A-Za-zÀ-ÿOʻGʻoʻgʻʻʼ'’-]+$/g,
    "",
  );
}

function classifyWord(raw: string): SpeechLang | "skip" {
  const stripped = stripWord(raw);
  if (!stripped) return "skip";
  const lower = stripped.toLowerCase();
  if (UZ_WORDS.has(lower) || /[ʻʼ‘’]/.test(stripped) || /[oOgG]['ʻ’]/.test(stripped)) {
    return "uz";
  }
  if (EN_WORDS.has(lower) || EN_MORPH.test(lower)) return "en";
  if (/^[A-Z][a-zA-Z'-]+$/.test(stripped) && stripped.length > 2) return "en";
  if (/^[A-Za-z][A-Za-z'-]*$/.test(stripped) && stripped.length >= 5 && !/[qQ]/.test(stripped)) {
    return "en";
  }
  return "uz";
}

function mergeParts(parts: SpeechPart[]): SpeechPart[] {
  const out: SpeechPart[] = [];
  for (const part of parts) {
    const text = part.text.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const last = out[out.length - 1];
    if (last && last.lang === part.lang) last.text = `${last.text} ${text}`.replace(/\s+/g, " ");
    else out.push({ lang: part.lang, text });
  }
  return out.length ? out : [{ lang: "uz", text: parts.map((p) => p.text).join(" ").trim() }];
}

/** Split mixed Uzbek/English teacher speech into TTS-friendly runs. */
export function splitSpeechByLang(text: string): SpeechPart[] {
  const src = text.replace(/\s+/g, " ").trim();
  if (!src) return [];

  if (src.includes("[[")) {
    const parts: SpeechPart[] = [];
    const re = /\[\[(uz|en)\]\]([\s\S]*?)\[\[\/\1\]\]/gi;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(src))) {
      const before = src.slice(last, m.index).trim();
      if (before) parts.push(...splitUntagged(before));
      const inner = m[2]?.trim();
      if (inner) parts.push({ lang: m[1]!.toLowerCase() as SpeechLang, text: inner });
      last = m.index + m[0].length;
    }
    const tail = src.slice(last).trim();
    if (tail) parts.push(...splitUntagged(tail));
    return mergeParts(parts);
  }

  return mergeParts(splitUntagged(src));
}

function splitUntagged(src: string): SpeechPart[] {
  const tokens = src.split(/(\s+)/);
  const parts: SpeechPart[] = [];
  let current: SpeechLang = "uz";
  let buf = "";

  const flush = () => {
    if (!buf) return;
    parts.push({ lang: current, text: buf });
    buf = "";
  };

  for (const token of tokens) {
    if (/^\s+$/.test(token)) {
      buf += token;
      continue;
    }
    const lang = classifyWord(token);
    if (lang === "skip") {
      buf += token;
      continue;
    }
    if (!buf) {
      current = lang;
      buf = token;
      continue;
    }
    if (lang !== current) {
      flush();
      current = lang;
      buf = token;
    } else {
      buf += token;
    }
  }
  flush();
  return parts;
}

export function speechPlain(parts: SpeechPart[] | string): string {
  if (typeof parts === "string") return parts;
  return parts.map((p) => p.text).join(" ");
}
