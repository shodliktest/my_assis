import assert from "node:assert/strict";
import { register } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

// speech.ts uses the "@/…" alias; teach Node about it for this test file only.
register("../../scripts/ts-alias-hooks.mjs", {
  parentURL: import.meta.url,
  data: { srcDir: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..") },
});

/**
 * Minimal stand-in for HTMLAudioElement that behaves like the browser where it matters:
 * play() can stay pending, pause() rejects a pending play(), and "pause" fires async.
 */
class FakeAudio {
  static all: FakeAudio[] = [];
  static holdPlay = false;
  src = "";
  preload = "";
  paused = true;
  ended = false;
  playCalls = 0;
  onplaying: (() => void) | null = null;
  onpause: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private pending: { resolve: () => void; reject: (e: Error) => void } | null = null;

  constructor() {
    FakeAudio.all.push(this);
  }
  setAttribute() {}
  play(): Promise<void> {
    this.playCalls += 1;
    this.paused = false;
    if (FakeAudio.holdPlay) {
      return new Promise<void>((resolve, reject) => {
        this.pending = { resolve, reject };
      });
    }
    return Promise.resolve().then(() => this.onplaying?.());
  }
  reset() {
    this.paused = true;
    this.ended = false;
    this.playCalls = 0;
    this.pending = null;
    this.onplaying = this.onpause = this.onended = this.onerror = null;
  }
  pause() {
    if (this.paused) return;
    this.paused = true;
    if (this.pending) {
      this.pending.reject(new Error("The play() request was interrupted by a call to pause()."));
      this.pending = null;
    }
    queueMicrotask(() => this.onpause?.());
  }
  /** What the browser does when the clip plays to its end. */
  finishPlayback() {
    this.paused = true;
    this.ended = true;
    this.onended?.();
  }
}

const g = globalThis as unknown as Record<string, unknown>;
g.Audio = FakeAudio;
g.window = { localStorage: { getItem: () => null, setItem: () => {} } };

const { speakText, stopSpeech, describeVoiceError } = await import("./speech.ts");

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
async function waitFor(cond: () => boolean, what: string, timeoutMs = 1500) {
  const t0 = Date.now();
  while (!cond()) {
    if (Date.now() - t0 > timeoutMs) assert.fail(`timed out waiting for ${what}`);
    await sleep(4);
  }
}
const clip = () => new Response(new Uint8Array([1, 2, 3, 4]));
const playing = () => FakeAudio.all.filter((a) => !a.paused);

function reset() {
  stopSpeech();
  FakeAudio.holdPlay = false;
  // speech.ts keeps ONE shared <audio> element for the whole page, so keep the
  // instance and only clear its per-test state.
  for (const a of FakeAudio.all) a.reset();
}

test("Pause: stopSpeech() silences a clip that is already playing, immediately", async () => {
  reset();
  g.fetch = async () => clip();
  const states: boolean[] = [];
  const done = speakText("Salom, bugun yangi mavzuni o'rganamiz.", { onSpeaking: (v) => states.push(v) });
  await waitFor(() => playing().length === 1, "audio to start");

  stopSpeech();
  // No awaiting: the voice must already be silent the moment stopSpeech() returns.
  assert.equal(playing().length, 0, "audio kept playing after stopSpeech()");
  await done;
  assert.equal(states.at(-1), false, "speaking indicator must end up false");
  await sleep(30);
  assert.equal(playing().length, 0, "audio restarted by itself after stopSpeech()");
});

test("Pause while the /api/tts request is still in flight: nothing plays afterwards", async () => {
  reset();
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => (release = r));
  // Worst case: the network layer ignores the abort and answers anyway.
  g.fetch = async () => {
    await gate;
    return clip();
  };
  const done = speakText("Bu savolga javob tayyorlanmoqda.");
  await sleep(10);
  stopSpeech();
  release();
  await done;
  await sleep(30);
  assert.equal(FakeAudio.all.reduce((n, a) => n + a.playCalls, 0), 0, "a stale clip started playing");
  assert.equal(playing().length, 0);
});

test("Pause between play() and the browser starting the clip", async () => {
  reset();
  FakeAudio.holdPlay = true;
  g.fetch = async () => clip();
  const done = speakText("Qisqa gap.");
  await waitFor(() => FakeAudio.all.some((a) => a.playCalls === 1), "play() to be requested");

  stopSpeech();
  assert.equal(playing().length, 0, "audio is still running after pausing a pending play()");
  await done;
  assert.equal(playing().length, 0);
});

test("a new clip replaces the old one — never two voices at once", async () => {
  reset();
  g.fetch = async () => clip();
  const first = speakText("Birinchi gap.");
  await waitFor(() => playing().length === 1, "first clip");
  const second = speakText("Ikkinchi gap.");
  await first;
  await waitFor(() => playing().length === 1, "second clip");
  assert.equal(FakeAudio.all.length, 1, "one shared audio element is reused");
  assert.equal(FakeAudio.all[0].playCalls, 2);
  FakeAudio.all[0].finishPlayback();
  await second;
  assert.equal(playing().length, 0);
});

test("a clip that plays to the end resolves speakText normally", async () => {
  reset();
  g.fetch = async () => clip();
  const states: boolean[] = [];
  const done = speakText("Tugaydi.", { onSpeaking: (v) => states.push(v) });
  await waitFor(() => playing().length === 1, "audio to start");
  await sleep(10); // a real clip lasts seconds; let the "playing" event fire first
  FakeAudio.all[0].finishPlayback();
  await done;
  // The indicator goes on while the clip plays and ends up off (it may be reported off twice).
  assert.ok(states.includes(true), "speaking indicator never turned on");
  assert.equal(states.at(-1), false);
  assert.ok(states.lastIndexOf(true) < states.lastIndexOf(false));
});

// ---- Microsoft voice failures: retry, honest fallback, Pause on the device voice -------------

type Voice = { lang: string; name: string };
class FakeUtterance {
  voice: Voice | null = null;
  lang = "";
  rate = 1;
  pitch = 1;
  volume = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  text: string;
  constructor(text: string) {
    this.text = text;
  }
}
class FakeSynth {
  voices: Voice[] = [];
  queue: FakeUtterance[] = [];
  cancels = 0;
  spokeCount = 0;
  speaking = false;
  pending = false;
  getVoices() {
    return this.voices;
  }
  addEventListener() {}
  removeEventListener() {}
  speak(u: FakeUtterance) {
    this.spokeCount += 1;
    this.queue.push(u);
    this.speaking = true;
    queueMicrotask(() => u.onstart?.());
  }
  cancel() {
    this.cancels += 1;
    this.queue = [];
    this.speaking = false;
  }
  /** The utterance reaches its end. */
  finishAll() {
    const q = this.queue;
    this.queue = [];
    this.speaking = false;
    for (const u of q) u.onend?.();
  }
}
g.SpeechSynthesisUtterance = FakeUtterance;
const win = g.window as Record<string, unknown>;

function useSynth(voices: Voice[] = []) {
  const synth = new FakeSynth();
  synth.voices = voices;
  win.speechSynthesis = synth;
  return synth;
}
const fail = (status: number, error = "TTS ulanishi yopildi") =>
  new Response(JSON.stringify({ error }), { status, headers: { "Content-Type": "application/json" } });

test("a temporary 502 is retried once and Microsoft's voice still speaks", async () => {
  reset();
  const synth = useSynth([{ lang: "uz-UZ", name: "Uzbek" }]);
  const answers = [fail(502), clip()];
  let calls = 0;
  g.fetch = async () => answers[calls++];
  const reports: string[] = [];
  const done = speakText("Salom.", { onEngine: (r) => reports.push(r.engine) });
  await waitFor(() => playing().length === 1, "Microsoft clip after the retry", 2500);
  FakeAudio.all[0].finishPlayback();
  await done;
  assert.equal(calls, 2);
  assert.deepEqual(reports, ["microsoft"]);
  assert.equal(synth.spokeCount, 0, "the device voice was never used");
});

test("a 403 is not retried (asking again cannot help)", async () => {
  reset();
  useSynth([]);
  let calls = 0;
  g.fetch = async () => {
    calls += 1;
    return fail(403, "So'rov rad etildi.");
  };
  const reports: { engine: string; detail?: string }[] = [];
  await speakText("Salom.", { onEngine: (r) => reports.push(r) });
  assert.equal(calls, 1);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].engine, "none");
  assert.match(reports[0].detail ?? "", /403/);
});

test("Microsoft down + an Uzbek device voice: that voice is used and reported as the device voice", async () => {
  reset();
  const synth = useSynth([
    { lang: "tr-TR", name: "Turkish" },
    { lang: "uz-UZ", name: "Uzbek" },
  ]);
  g.fetch = async () => fail(503);
  const reports: { engine: string; detail?: string }[] = [];
  const done = speakText("Bugun yangi mavzu.", { onEngine: (r) => reports.push(r) });
  await waitFor(() => synth.queue.length === 1, "device voice to start", 3000);
  assert.equal(synth.queue[0].voice?.lang, "uz-UZ", "the Uzbek voice is chosen, never the Turkish one");
  synth.finishAll();
  await done;
  assert.deepEqual(reports.map((r) => r.engine), ["device"]);
  assert.match(reports[0].detail ?? "", /TTS ulanishi yopildi/);
});

test("Microsoft down and only a Turkish device voice: stays silent instead of speaking with a Turkish accent", async () => {
  reset();
  const synth = useSynth([{ lang: "tr-TR", name: "Turkish" }]);
  g.fetch = async () => fail(503);
  const reports: string[] = [];
  await speakText("Bugun yangi mavzu.", { onEngine: (r) => reports.push(r.engine) });
  assert.deepEqual(reports, ["none"]);
  assert.equal(synth.queue.length, 0);
});

test("Pause silences the device voice at once and leaves no promise hanging", async () => {
  reset();
  const synth = useSynth([{ lang: "uz-UZ", name: "Uzbek" }]);
  g.fetch = async () => fail(403);
  const done = speakText("Uzun matn. ".repeat(20));
  await waitFor(() => synth.queue.length === 1, "device voice to start");
  const before = synth.cancels;
  stopSpeech();
  assert.ok(synth.cancels > before, "speechSynthesis.cancel() was not called");
  assert.equal(synth.queue.length, 0);
  // the pending speakText must settle by itself (nothing will fire `end` after a cancel)
  await Promise.race([done, sleep(500).then(() => assert.fail("speakText never settled after Pause"))]);
  // the second, delayed cancel only fires while nothing newer has started
  await sleep(120);
  assert.equal(synth.queue.length, 0);
});

test("the delayed second cancel never kills a clip that started right after Pause", async () => {
  reset();
  const synth = useSynth([{ lang: "uz-UZ", name: "Uzbek" }]);
  g.fetch = async () => clip();
  stopSpeech();
  const done = speakText("Yangi gap.");
  await waitFor(() => playing().length === 1, "new clip");
  const cancelsBefore = synth.cancels;
  await sleep(120);
  assert.equal(synth.cancels, cancelsBefore, "a late cancel hit the new clip");
  FakeAudio.all[0].finishPlayback();
  await done;
});

test("Pause during the request is not reported as a voice failure", async () => {
  reset();
  useSynth([{ lang: "uz-UZ", name: "Uzbek" }]);
  g.fetch = (_url: unknown, init?: { signal?: AbortSignal }) =>
    new Promise((_res, rej) => {
      init?.signal?.addEventListener("abort", () => rej(new DOMException("aborted", "AbortError")));
    });
  const reports: string[] = [];
  const done = speakText("Salom.", { onEngine: (r) => reports.push(r.engine) });
  await sleep(10);
  stopSpeech();
  await done;
  assert.deepEqual(reports, []);
});

test("describeVoiceError gives a short readable reason", () => {
  assert.match(describeVoiceError(new TypeError("fetch failed")), /tarmoq/);
  const denied = new Error("x");
  denied.name = "NotAllowedError";
  assert.match(describeVoiceError(denied), /brauzer/);
});
