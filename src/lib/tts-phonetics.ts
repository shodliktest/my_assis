/**
 * English (and common loanwords) → Uzbek-friendly pronunciation for Madina/Sardor TTS.
 * Applied only to the audio pipeline; on-screen caption stays original.
 */

const PHONETIC_MAP: Array<{ re: RegExp; to: string }> = [
  // Tech / product
  { re: /\bpython\b/gi, to: "payton" },
  { re: /\bstreamlit\b/gi, to: "strimlit" },
  { re: /\bjavascript\b/gi, to: "java skript" },
  { re: /\btypescript\b/gi, to: "tayp skript" },
  { re: /\breact\b/gi, to: "riakt" },
  { re: /\bnext\.?js\b/gi, to: "nekst jey es" },
  { re: /\bnode\.?js\b/gi, to: "noud jey es" },
  { re: /\bgithub\b/gi, to: "git xab" },
  { re: /\bvercel\b/gi, to: "versel" },
  { re: /\bgoogle\b/gi, to: "gugil" },
  { re: /\byoutube\b/gi, to: "yutub" },
  { re: /\bwhatsapp\b/gi, to: "votsap" },
  { re: /\btelegram\b/gi, to: "telegram" },
  { re: /\bchatgpt\b/gi, to: "chat jipti" },
  { re: /\bopenai\b/gi, to: "oupen ey ay" },
  { re: /\bapi\b/gi, to: "ey pi ay" },
  { re: /\bhtml\b/gi, to: "eych ti em el" },
  { re: /\bcss\b/gi, to: "si es es" },
  { re: /\bjson\b/gi, to: "jey son" },
  { re: /\bsql\b/gi, to: "es kyu el" },
  { re: /\bai\b/gi, to: "ey ay" },
  { re: /\bapp\b/gi, to: "ep" },
  { re: /\bbot\b/gi, to: "bot" },
  { re: /\bquiz\b/gi, to: "kuiz" },
  { re: /\bdeveloper\b/gi, to: "developir" },
  { re: /\bwebsite\b/gi, to: "vebsayt" },
  { re: /\bonline\b/gi, to: "onlayn" },
  { re: /\boffline\b/gi, to: "oflayn" },
  { re: /\bemail\b/gi, to: "imeyl" },
  { re: /\bpassword\b/gi, to: "pasvord" },
  { re: /\blogin\b/gi, to: "login" },
  // English grammar terms (common in lessons)
  { re: /\bpresent continuous\b/gi, to: "prezent kontinuus" },
  { re: /\bpresent simple\b/gi, to: "prezent simple" },
  { re: /\bpast simple\b/gi, to: "past simple" },
  { re: /\bpast continuous\b/gi, to: "past kontinuus" },
  { re: /\bfuture simple\b/gi, to: "fyuchar simple" },
  { re: /\bpresent perfect\b/gi, to: "prezent perfekt" },
  { re: /\bcontinuous\b/gi, to: "kontinuus" },
  { re: /\bsimple\b/gi, to: "simple" },
  { re: /\benglish\b/gi, to: "inglish" },
  { re: /\bgrammar\b/gi, to: "grammatika" },
  { re: /\bverb\b/gi, to: "verb" },
  { re: /\bnoun\b/gi, to: "naun" },
  { re: /\badjective\b/gi, to: "adjektiv" },
  { re: /\badverb\b/gi, to: "adverb" },
  { re: /\bsubject\b/gi, to: "sabjekt" },
  { re: /\bobject\b/gi, to: "obyekt" },
  { re: /\bnegative\b/gi, to: "negativ" },
  { re: /\bpositive\b/gi, to: "pozitiv" },
  { re: /\bquestion\b/gi, to: "kuestion" },
  { re: /\bformula\b/gi, to: "formula" },
  { re: /\bexample\b/gi, to: "ekzampl" },
  // Everyday English words often mixed into Uzbek speech
  { re: /\btime\b/gi, to: "taym" },
  { re: /\bok\b/gi, to: "okay" },
  { re: /\bokay\b/gi, to: "okay" },
  { re: /\bhello\b/gi, to: "halou" },
  { re: /\bhi\b/gi, to: "hay" },
  { re: /\bbye\b/gi, to: "bay" },
  { re: /\bplease\b/gi, to: "pliz" },
  { re: /\bsorry\b/gi, to: "sori" },
  { re: /\bthanks\b/gi, to: "thenks" },
  { re: /\bthank you\b/gi, to: "thenk yu" },
  { re: /\byes\b/gi, to: "yes" },
  { re: /\bno\b/gi, to: "nou" },
  { re: /\bgood\b/gi, to: "gud" },
  { re: /\bbad\b/gi, to: "bed" },
  { re: /\bnow\b/gi, to: "nau" },
  { re: /\bright now\b/gi, to: "rayt nau" },
  { re: /\bat the moment\b/gi, to: "et za moment" },
  { re: /\bevery day\b/gi, to: "evri dey" },
  { re: /\btoday\b/gi, to: "tudey" },
  { re: /\byesterday\b/gi, to: "yestudey" },
  { re: /\btomorrow\b/gi, to: "tomorou" },
  // Common lesson example verbs/phrases
  { re: /\breading\b/gi, to: "ridining" },
  { re: /\bworking\b/gi, to: "vorking" },
  { re: /\bplaying\b/gi, to: "pleying" },
  { re: /\bsleeping\b/gi, to: "slipining" },
  { re: /\bcooking\b/gi, to: "kuking" },
  { re: /\bwatching\b/gi, to: "voching" },
  { re: /\blistening\b/gi, to: "lisining" },
  { re: /\bwriting\b/gi, to: "rayting" },
  { re: /\bgoing\b/gi, to: "going" },
  { re: /\bcoming\b/gi, to: "kaming" },
  { re: /\bam\b/gi, to: "em" },
  { re: /\bis\b/gi, to: "iz" },
  { re: /\bare\b/gi, to: "ar" },
  { re: /\bisn't\b/gi, to: "iznt" },
  { re: /\baren't\b/gi, to: "arnt" },
  { re: /\bdon't\b/gi, to: "dount" },
  { re: /\bdoesn't\b/gi, to: "daznt" },
  { re: /\bwon't\b/gi, to: "wount" },
  { re: /\bcan't\b/gi, to: "kent" },
  { re: /\bi am\b/gi, to: "ay em" },
  { re: /\byou are\b/gi, to: "yu ar" },
  { re: /\bhe is\b/gi, to: "hi iz" },
  { re: /\bshe is\b/gi, to: "shi iz" },
  { re: /\bit is\b/gi, to: "it iz" },
  { re: /\bwe are\b/gi, to: "vi ar" },
  { re: /\bthey are\b/gi, to: "zey ar" },
];

/** Rough Latin→Uzbek-sounding heuristic for unknown English tokens. */
function heuristicEnglishWord(word: string): string {
  if (word.length < 3) return word;
  // Keep pure numbers / mixed codes
  if (!/^[A-Za-z']+$/.test(word)) return word;

  let s = word.toLowerCase();

  // Multi-letter patterns first
  s = s.replace(/tion/g, "shn");
  s = s.replace(/sion/g, "zhn");
  s = s.replace(/ough/g, "of");
  s = s.replace(/augh/g, "of");
  s = s.replace(/eigh/g, "ey");
  s = s.replace(/ight/g, "ayt");
  s = s.replace(/ph/g, "f");
  s = s.replace(/wh/g, "v");
  s = s.replace(/th/g, "t");
  s = s.replace(/ck/g, "k");
  s = s.replace(/qu/g, "ku");
  s = s.replace(/ch/g, "ch");
  s = s.replace(/sh/g, "sh");
  s = s.replace(/ee|ea/g, "i");
  s = s.replace(/oo/g, "u");
  s = s.replace(/ay|ai/g, "ey");
  s = s.replace(/oy|oi/g, "oy");
  s = s.replace(/aw|au/g, "o");
  s = s.replace(/ow/g, "ov");
  s = s.replace(/ing$/g, "ing");
  s = s.replace(/ed$/g, "d");
  s = s.replace(/ly$/g, "li");
  s = s.replace(/c([eiy])/g, "s$1");
  s = s.replace(/c/g, "k");
  s = s.replace(/x/g, "ks");
  s = s.replace(/j/g, "j");
  s = s.replace(/w/g, "v");
  s = s.replace(/y/g, "i");
  // Double letters
  s = s.replace(/(.)\1+/g, "$1");
  return s;
}

/** Prepare text for Uzbek neural TTS (Madina / Sardor). */
export function adaptForUzbekTts(text: string): string {
  let out = text.normalize("NFC").trim();
  if (!out) return out;

  // 1) Dictionary (known words)
  for (const { re, to } of PHONETIC_MAP) {
    out = out.replace(re, to);
  }

  // 2) ALL-CAPS acronyms → spaced letters
  out = out.replace(/\b[A-Z]{2,6}\b/g, (m) => m.split("").join(" ").toLowerCase());

  // 3) Heuristic for remaining pure-Latin words (skip if looks Uzbek-latin with o'/g')
  out = out.replace(/\b[A-Za-z']{3,}\b/g, (word) => {
    // Already adapted tokens often lowercase ascii without typical English clusters — still run heuristic
    // Skip very short handled by dict; skip if contains digit
    if (/\d/.test(word)) return word;
    return heuristicEnglishWord(word);
  });

  out = out.replace(/\s+/g, " ").trim();
  return out;
}

export type TutorVoiceId = "shukrona" | "saidumar";

export const TUTOR_VOICES: Record<
  TutorVoiceId,
  { id: TutorVoiceId; label: string; hint: string; edge: string }
> = {
  shukrona: {
    id: "shukrona",
    label: "Shukrona",
    hint: "Qiz ovozi",
    edge: "uz-UZ-MadinaNeural",
  },
  saidumar: {
    id: "saidumar",
    label: "Saidumar",
    hint: "Erkak ovoz",
    edge: "uz-UZ-SardorNeural",
  },
};

export function edgeVoiceForTutor(id: TutorVoiceId): string {
  return TUTOR_VOICES[id]?.edge ?? TUTOR_VOICES.shukrona.edge;
}

export const TUTOR_VOICE_STORAGE_KEY = "daftar.tutorVoice";
