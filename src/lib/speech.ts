import { splitSpeechByLang, type SpeechLang, type SpeechPart } from "@/lib/lang-split";

let current: HTMLAudioElement | null = null;
let seq = 0;
let speakingCb: ((value: boolean) => void) | null = null;

export const UZ_VOICE = "uz-UZ-MadinaNeural";
export const EN_VOICE = "en-US-JennyNeural";

export function stopSpeech() {
  seq += 1;
  speakingCb?.(false);
  speakingCb = null;
  if (current) {
    current.pause();
    current.src = "";
    current = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function voiceFor(lang: SpeechLang) {
  return lang === "en" ? EN_VOICE : UZ_VOICE;
}

async function playBuffer(buf: ArrayBuffer, signal: AbortSignal, my: number): Promise<void> {
  if (signal.aborted || my !== seq) return;
  const blob = new Blob([buf], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  await new Promise<void>((resolve, reject) => {
    if (signal.aborted || my !== seq) {
      URL.revokeObjectURL(url);
      resolve();
      return;
    }
    const audio = new Audio(url);
    current = audio;
    audio.setAttribute("playsinline", "true");
    audio.onplaying = () => {
      if (my === seq) speakingCb?.(true);
    };
    audio.onpause = () => {
      if (current === audio) speakingCb?.(false);
    };
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (current === audio) current = null;
      speakingCb?.(false);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (current === audio) current = null;
      speakingCb?.(false);
      reject(new Error("audio error"));
    };
    audio.play().catch(reject);
  });
}

async function speakMicrosoft(parts: SpeechPart[], signal: AbortSignal, my: number): Promise<void> {
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      parts: parts.map((p) => ({ text: p.text, lang: p.lang, voice: voiceFor(p.lang) })),
    }),
    signal,
  });
  if (!res.ok) throw new Error(`tts ${res.status}`);
  const buf = await res.arrayBuffer();
  await playBuffer(buf, signal, my);
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: SpeechLang): SpeechSynthesisVoice | null {
  const rank = (v: SpeechSynthesisVoice) => {
    const code = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    if (lang === "uz") {
      if (code.startsWith("uz")) return 0;
      if (name.includes("uzbek")) return 1;
      if (code.startsWith("tr")) return 2;
      return 8;
    }
    if (code.startsWith("en-us")) return 0;
    if (code.startsWith("en")) return 1;
    if (name.includes("english")) return 2;
    return 8;
  };
  const sorted = [...voices].sort((a, b) => rank(a) - rank(b));
  return sorted[0] ?? null;
}

function speakBrowserPart(text: string, lang: SpeechLang, my: number): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "en" ? "en-US" : "uz-UZ";
    utter.rate = lang === "en" ? 0.96 : 0.92;
    utter.pitch = 1;
    const voice = pickVoice(window.speechSynthesis.getVoices(), lang);
    if (voice) utter.voice = voice;
    utter.onstart = () => {
      if (my === seq) speakingCb?.(true);
    };
    utter.onend = () => {
      speakingCb?.(false);
      resolve();
    };
    utter.onerror = () => {
      speakingCb?.(false);
      resolve();
    };
    window.speechSynthesis.speak(utter);
  });
}

async function speakBrowser(parts: SpeechPart[], my: number): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  for (const part of parts) {
    if (my !== seq) return;
    await speakBrowserPart(part.text, part.lang, my);
  }
}

export async function speakText(
  text: string,
  opts?: { onSpeaking?: (value: boolean) => void },
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const my = ++seq;
  speakingCb = opts?.onSpeaking ?? null;
  speakingCb?.(false);
  const parts = splitSpeechByLang(trimmed);
  const ac = new AbortController();
  try {
    await speakMicrosoft(parts, ac.signal, my);
  } catch {
    if (my !== seq) return;
    await speakBrowser(parts, my);
  } finally {
    if (my === seq) speakingCb?.(false);
  }
}

export function estimateSpeechMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(28000, Math.max(2200, words * 380));
}
