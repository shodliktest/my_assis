import { splitSpeechByLang, type SpeechLang, type SpeechPart } from "@/lib/lang-split";
import {
  adaptForUzbekTts,
  edgeVoiceForTutor,
  TUTOR_VOICE_STORAGE_KEY,
  type TutorVoiceId,
} from "@/lib/tts-phonetics";

let current: HTMLAudioElement | null = null;
let seq = 0;
let speakingCb: ((value: boolean) => void) | null = null;
let activeTutor: TutorVoiceId = "shukrona";

export const UZ_VOICE = "uz-UZ-MadinaNeural";
export const EN_VOICE = "uz-UZ-MadinaNeural";

export function getTutorVoice(): TutorVoiceId {
  return activeTutor;
}

export function setTutorVoice(id: TutorVoiceId) {
  activeTutor = id === "saidumar" ? "saidumar" : "shukrona";
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(TUTOR_VOICE_STORAGE_KEY, activeTutor);
    } catch {
      /* ignore */
    }
  }
}

export function initTutorVoiceFromStorage() {
  if (typeof window === "undefined") return;
  try {
    const v = window.localStorage.getItem(TUTOR_VOICE_STORAGE_KEY);
    if (v === "saidumar" || v === "shukrona") activeTutor = v;
  } catch {
    /* ignore */
  }
}

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

function currentEdgeVoice(): string {
  return edgeVoiceForTutor(activeTutor);
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

/** One continuous audio with selected tutor voice + phonetic adaptation. */
async function speakMicrosoft(parts: SpeechPart[], signal: AbortSignal, my: number): Promise<void> {
  const voice = currentEdgeVoice();
  // Merge into fewer chunks: adapt every part for Uzbek neural TTS
  const adapted = parts
    .map((p) => ({ text: adaptForUzbekTts(p.text), lang: "uz" as const, voice }))
    .filter((p) => p.text.length > 0);
  if (!adapted.length) return;

  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parts: adapted }),
    signal,
  });
  if (!res.ok) throw new Error(`tts ${res.status}`);
  const buf = await res.arrayBuffer();
  await playBuffer(buf, signal, my);
}

function pickVoice(voices: SpeechSynthesisVoice[], preferMale: boolean): SpeechSynthesisVoice | null {
  const rank = (v: SpeechSynthesisVoice) => {
    const code = v.lang.toLowerCase();
    const name = v.name.toLowerCase();
    if (code.startsWith("uz")) return preferMale ? (name.includes("male") ? 0 : 1) : 0;
    if (name.includes("uzbek")) return 2;
    if (code.startsWith("tr")) return preferMale ? 3 : 4;
    return 9;
  };
  const sorted = [...voices]
    .filter((v) => rank(v) < 9)
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  return sorted[0] ?? null;
}

function speakBrowserPart(text: string, my: number): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(adaptForUzbekTts(text));
    utter.lang = "uz-UZ";
    utter.rate = activeTutor === "saidumar" ? 0.92 : 0.94;
    utter.pitch = activeTutor === "saidumar" ? 0.95 : 1.05;
    utter.volume = 1;
    const voice = pickVoice(window.speechSynthesis.getVoices(), activeTutor === "saidumar");
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
    await speakBrowserPart(part.text, my);
  }
}

export async function speakText(
  text: string,
  opts?: { onSpeaking?: (value: boolean) => void; voice?: TutorVoiceId },
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (opts?.voice) setTutorVoice(opts.voice);
  const my = ++seq;
  speakingCb = opts?.onSpeaking ?? null;
  speakingCb?.(false);
  // Still split for future use, but all go through same Uzbek tutor voice + phonetics
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
