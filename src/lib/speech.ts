import { type SpeechPart } from "@/lib/lang-split";
import { renderSpoken } from "@/lib/spoken";
import {
  adaptForUzbekTts,
  edgeVoiceForTutor,
  TUTOR_VOICE_STORAGE_KEY,
  type TutorVoiceId,
} from "@/lib/tts-phonetics";

/** Which voice actually spoke: Microsoft's neural voice, an Uzbek voice of the device, or nothing. */
export type VoiceEngine = "microsoft" | "device" | "none";
export type VoiceReport = { engine: VoiceEngine; detail?: string };

/** A failed /api/tts call; `retryable` tells whether asking again can help. */
class TtsError extends Error {
  status?: number;
  retryable: boolean;
  constructor(message: string, retryable: boolean, status?: number) {
    super(message);
    this.name = "TtsError";
    this.status = status;
    this.retryable = retryable;
  }
}

let current: HTMLAudioElement | null = null;
let seq = 0;
let speakingCb: ((value: boolean) => void) | null = null;
let activeTutor: TutorVoiceId = "shukrona";
let abortCtl: AbortController | null = null;
/** The device-voice utterance being read (kept so Pause can detach and cancel it). */
let deviceUtterance: SpeechSynthesisUtterance | null = null;
/** Resolves the pending device-voice wait, so Pause never leaves a promise hanging. */
let deviceDone: (() => void) | null = null;

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

/** Silences the shared <audio> element right now (also cancels a pending play()). */
function silenceAudio() {
  const audio = audioEl;
  if (!audio) return;
  current = null;
  detachAudio(audio);
  try {
    audio.pause();
  } catch {
    /* ignore */
  }
}

export function stopSpeech() {
  seq += 1;
  speakingCb?.(false);
  speakingCb = null;
  // Silence the audio BEFORE aborting. Aborting runs playBuffer's cleanup, which
  // forgets `current`; pausing afterwards found nothing to pause and the clip
  // played on to its end after the user pressed Pause.
  silenceAudio();
  abortCtl?.abort();
  abortCtl = null;
  silenceDeviceVoice();
}

/**
 * Stops the device (speechSynthesis) voice. Some browsers drop the first cancel() when the
 * utterance is still starting, or keep reading a long text, so a second cancel() follows
 * shortly after — but only while nothing newer has started (same `seq`).
 */
function silenceDeviceVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  if (deviceUtterance) {
    deviceUtterance.onstart = deviceUtterance.onend = deviceUtterance.onerror = null;
    deviceUtterance = null;
  }
  synth.cancel();
  deviceDone?.();
  const stopped = seq;
  setTimeout(() => {
    if (seq === stopped && (synth.speaking || synth.pending)) synth.cancel();
  }, 80);
}

function currentEdgeVoice(): string {
  return edgeVoiceForTutor(activeTutor);
}

async function playBuffer(buf: ArrayBuffer, signal: AbortSignal, my: number, onStarted?: () => void): Promise<void> {
  if (signal.aborted || my !== seq) return;
  const url = URL.createObjectURL(new Blob([buf], { type: "audio/mpeg" }));
  const audio = getAudio();
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", onAbort);
      // Only touch the shared element while this clip still owns it; once it was
      // stopped or replaced, stopSpeech() / the newer clip already handled it.
      if (my === seq && current === audio) {
        detachAudio(audio);
        current = null;
      }
      URL.revokeObjectURL(url);
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
      if (my !== seq) return;
      speakingCb?.(true);
      onStarted?.();
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
        // Stopped/replaced while the browser was starting the clip: stopSpeech() has
        // already silenced the element (a newer clip may own it now), just settle.
        if (my !== seq || signal.aborted) finish();
      },
      (err: unknown) => finish(err instanceof Error ? err : new Error("play failed")),
    );
  });
}

/** One continuous audio with selected tutor voice + phonetic adaptation. */
async function speakMicrosoft(parts: SpeechPart[], signal: AbortSignal, my: number, onStarted?: () => void): Promise<void> {
  const voice = currentEdgeVoice();
  // The text is already in Uzbek letters (renderSpoken in speakText): send it as is.
  const adapted = parts
    .map((p) => ({ text: p.text, lang: "uz" as const, voice, phonetic: true }))
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
    if (!res.ok) {
      let reason = "";
      try {
        reason = String(((await res.json()) as { error?: unknown }).error ?? "").slice(0, 80);
      } catch {
        /* no JSON body */
      }
      // 4xx (except "too many requests") will not change on a retry.
      throw new TtsError(reason || `tts ${res.status}`, res.status >= 500 || res.status === 429, res.status);
    }
    buf = await res.arrayBuffer();
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", forwardAbort);
  }
  await playBuffer(buf, signal, my, onStarted);
}

/**
 * Only a real Uzbek voice qualifies. An earlier version also accepted Turkish voices, which read
 * Uzbek letters with a Turkish accent: it sounded like the tutor's voice had been swapped.
 */
function pickVoice(voices: SpeechSynthesisVoice[], preferMale: boolean): SpeechSynthesisVoice | null {
  const uz = voices.filter((v) => v.lang.toLowerCase().startsWith("uz") || v.name.toLowerCase().includes("uzbek"));
  if (!uz.length) return null;
  const male = (v: SpeechSynthesisVoice) => /male|sardor|erkak/i.test(v.name) && !/female/i.test(v.name);
  const sorted = [...uz].sort(
    (a, b) => Number(male(preferMale ? b : a)) - Number(male(preferMale ? a : b)) || a.name.localeCompare(b.name),
  );
  return sorted[0];
}

/** Browsers fill the voice list asynchronously: wait briefly for it. */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length) return Promise.resolve(now);
  return new Promise((resolve) => {
    const done = () => {
      synth.removeEventListener?.("voiceschanged", done);
      resolve(synth.getVoices());
    };
    synth.addEventListener?.("voiceschanged", done);
    setTimeout(done, 600);
  });
}

function speakBrowserPart(text: string, voice: SpeechSynthesisVoice, my: number, onStarted?: () => void): Promise<void> {
  return new Promise((resolve) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = voice.lang || "uz-UZ";
    utter.voice = voice;
    utter.rate = activeTutor === "saidumar" ? 0.92 : 0.94;
    utter.pitch = activeTutor === "saidumar" ? 0.95 : 1.05;
    utter.volume = 1;
    const settle = () => {
      if (deviceUtterance === utter) deviceUtterance = null;
      deviceDone = null;
      resolve();
    };
    deviceDone = settle;
    utter.onstart = () => {
      if (my !== seq) return;
      speakingCb?.(true);
      onStarted?.();
    };
    utter.onend = () => {
      speakingCb?.(false);
      settle();
    };
    utter.onerror = () => {
      speakingCb?.(false);
      settle();
    };
    deviceUtterance = utter;
    window.speechSynthesis.speak(utter);
  });
}

/** Reads the text with an Uzbek voice of the device. False when the device has none (nothing is read). */
async function speakBrowser(parts: SpeechPart[], my: number, onStarted?: () => void): Promise<boolean> {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const voice = pickVoice(await loadVoices(), activeTutor === "saidumar");
  if (!voice || my !== seq) return false;
  window.speechSynthesis.cancel();
  for (const part of parts) {
    if (my !== seq) return true;
    await speakBrowserPart(part.text, voice, my, onStarted);
  }
  return true;
}

/** A short, human reason for the status line (Uzbek). */
export function describeVoiceError(err: unknown): string {
  if (err instanceof TtsError) {
    if (err.status === 403) return "ruxsat berilmadi (403)";
    if (err.status === 429) return "so'rovlar ko'p (429)";
    return `ovoz serveri javob bermadi (${err.message})`;
  }
  const name = err instanceof Error ? err.name : "";
  if (name === "NotAllowedError") return "brauzer ovozni blokladi: sahifaga bir marta bosing";
  if (name === "AbortError" || name === "TimeoutError") return "javob kechikdi";
  if (err instanceof TypeError) return "tarmoq uzildi";
  return "noma'lum xato";
}

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });

/** Microsoft's voice, asked twice before giving up on a temporary failure. */
async function speakMicrosoftWithRetry(parts: SpeechPart[], signal: AbortSignal, my: number, onStarted?: () => void): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await speakMicrosoft(parts, signal, my, onStarted);
      return;
    } catch (err) {
      lastErr = err;
      if (signal.aborted || my !== seq) throw err;
      const retryable = err instanceof TtsError ? err.retryable : err instanceof TypeError;
      if (!retryable) break;
      await wait(700, signal);
      if (signal.aborted || my !== seq) throw err;
    }
  }
  throw lastErr;
}

export async function speakText(
  text: string,
  opts?: {
    onSpeaking?: (value: boolean) => void;
    voice?: TutorVoiceId;
    /** Which voice is really speaking (reported once per clip), so the UI can show it. */
    onEngine?: (report: VoiceReport) => void;
  },
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (opts?.voice) setTutorVoice(opts.voice);
  // Silence whatever is still playing/fetching first, so clips never overlap.
  stopSpeech();
  const my = ++seq;
  speakingCb = opts?.onSpeaking ?? null;
  speakingCb?.(false);
  // One Uzbek voice reads everything: {{shown|said}} fragments use the model's own
  // pronunciation, the rest gets the rule-based English respelling as a safety net.
  const spoken = renderSpoken(trimmed, adaptForUzbekTts);
  if (!spoken) return;
  const parts: SpeechPart[] = [{ text: spoken, lang: "uz" }];
  const ac = new AbortController();
  abortCtl = ac;
  // Reported when the voice really starts (not when the clip ends), once per clip.
  let reported = false;
  const report = (r: VoiceReport) => {
    if (reported || my !== seq) return;
    reported = true;
    opts?.onEngine?.(r);
  };
  try {
    await speakMicrosoftWithRetry(parts, ac.signal, my, () => report({ engine: "microsoft" }));
    report({ engine: "microsoft" }); // a clip that finished before its "playing" event fired
  } catch (err) {
    if (my !== seq || ac.signal.aborted) return;
    // Microsoft's voice did not answer. Never switch silently: an Uzbek device voice is used
    // only if the device has one, and the caller is told which voice (or none) was used.
    const detail = describeVoiceError(err);
    const used = await speakBrowser(parts, my, () => report({ engine: "device", detail }));
    report({ engine: used ? "device" : "none", detail });
  } finally {
    if (abortCtl === ac) abortCtl = null;
    if (my === seq) speakingCb?.(false);
  }
}

export function estimateSpeechMs(text: string): number {
  const words = renderSpoken(text).split(/\s+/).filter(Boolean).length;
  return Math.min(28000, Math.max(2200, words * 380));
}

/**
 * Upper bound for waiting on a spoken beat. Real speech takes roughly
 * 0.45s/word plus the TTS round trip; this is the safety net for a browser
 * voice that never fires `onend`, not the expected duration.
 */
export function speechWaitCapMs(text: string): number {
  const words = renderSpoken(text).split(/\s+/).filter(Boolean).length;
  return Math.min(80_000, Math.max(12_000, words * 600 + 9_000));
}
