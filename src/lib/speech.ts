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
let abortCtl: AbortController | null = null;

// One shared <audio> element. iOS/Safari only lets an element play from async
// code (after the /api/tts fetch) once that same element was started by a tap,
// so we unlock it on the first user gesture and reuse it for every clip.
let audioEl: HTMLAudioElement | null = null;
let audioUnlocked = false;
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
/** Hard stop for a stuck /api/tts request (server budget is 45s). */
const TTS_FETCH_TIMEOUT_MS = 55_000;

function getAudio(): HTMLAudioElement {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "auto";
    audioEl.setAttribute("playsinline", "true");
  }
  return audioEl;
}

function detachAudio(audio: HTMLAudioElement) {
  audio.onplaying = null;
  audio.onpause = null;
  audio.onended = null;
  audio.onerror = null;
}

/** Unlock audio playback. Call from a user gesture (tap / key). Safe to call repeatedly. */
export function primeSpeech() {
  if (typeof window === "undefined" || audioUnlocked || current) return;
  try {
    const audio = getAudio();
    audio.src = SILENT_WAV;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audioUnlocked = true;
      })
      .catch(() => {
        /* not a trusted gesture — try again on the next one */
      });
  } catch {
    /* ignore */
  }
}

/** Registers one-time gesture listeners that unlock audio; returns the cleanup. */
export function installAudioUnlock(): () => void {
  if (typeof window === "undefined") return () => {};
  const events = ["click", "touchend", "keydown"] as const;
  const handler = () => {
    primeSpeech();
    if (audioUnlocked) remove();
  };
  const remove = () => {
    for (const name of events) window.removeEventListener(name, handler, true);
  };
  for (const name of events) window.addEventListener(name, handler, true);
  return remove;
}

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
  abortCtl?.abort();
  abortCtl = null;
  if (current) {
    const audio = current;
    current = null;
    detachAudio(audio);
    audio.pause();
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
  const url = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
  const audio = getAudio();
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      detachAudio(audio);
      URL.revokeObjectURL(url);
      if (current === audio) current = null;
      if (err) reject(err);
      else resolve();
    };
    const onAbort = () => finish();
    if (signal.aborted || my !== seq) {
      finish();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    current = audio;
    audio.onplaying = () => {
      if (my === seq) speakingCb?.(true);
    };
    audio.onpause = () => {
      if (!audio.ended && my === seq) speakingCb?.(false);
    };
    audio.onended = () => {
      speakingCb?.(false);
      finish();
    };
    audio.onerror = () => {
      speakingCb?.(false);
      finish(new Error("audio error"));
    };
    audio.src = url;
    audio.play().then(
      () => {
        audioUnlocked = true;
      },
      (err: unknown) => finish(err instanceof Error ? err : new Error("play failed")),
    );
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

  // Own controller so a timeout (→ browser voice fallback) is distinguishable
  // from stopSpeech() aborting the caller's signal (→ stay silent).
  const request = new AbortController();
  const timer = setTimeout(() => request.abort(), TTS_FETCH_TIMEOUT_MS);
  const forwardAbort = () => request.abort();
  signal.addEventListener("abort", forwardAbort, { once: true });
  let buf: ArrayBuffer;
  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parts: adapted }),
      signal: request.signal,
    });
    if (!res.ok) throw new Error(`tts ${res.status}`);
    buf = await res.arrayBuffer();
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", forwardAbort);
  }
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
  // Silence whatever is still playing/fetching first, so clips never overlap.
  stopSpeech();
  const my = ++seq;
  speakingCb = opts?.onSpeaking ?? null;
  speakingCb?.(false);
  // Still split for future use, but all go through same Uzbek tutor voice + phonetics
  const parts = splitSpeechByLang(trimmed);
  const ac = new AbortController();
  abortCtl = ac;
  try {
    await speakMicrosoft(parts, ac.signal, my);
  } catch {
    if (my !== seq || ac.signal.aborted) return;
    await speakBrowser(parts, my);
  } finally {
    if (abortCtl === ac) abortCtl = null;
    if (my === seq) speakingCb?.(false);
  }
}

export function estimateSpeechMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(28000, Math.max(2200, words * 380));
}

/**
 * Upper bound for waiting on a spoken beat. Real speech takes roughly
 * 0.45s/word plus the TTS round trip; this is the safety net for a browser
 * voice that never fires `onend`, not the expected duration.
 */
export function speechWaitCapMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(80_000, Math.max(12_000, words * 600 + 9_000));
}
