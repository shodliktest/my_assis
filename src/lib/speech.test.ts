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

const { speakText, stopSpeech } = await import("./speech.ts");

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
