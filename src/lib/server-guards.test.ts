import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clientKey,
  createDeadline,
  createRateLimiter,
  isSameSiteRequest,
  mapLimit,
  splitIntoChunks,
} from "./server-guards.ts";

test("deadline counts down and never goes negative", () => {
  let t = 1000;
  const d = createDeadline(500, () => t);
  assert.equal(d.remaining(), 500);
  assert.equal(d.expired(), false);
  t = 1400;
  assert.equal(d.remaining(), 100);
  t = 5000;
  assert.equal(d.remaining(), 0);
  assert.equal(d.expired(), true);
});

test("rate limiter blocks after the limit and recovers after the window", () => {
  const rl = createRateLimiter({ limit: 3, windowMs: 1000 });
  assert.deepEqual(rl.check("a", 0), { ok: true });
  assert.deepEqual(rl.check("a", 10), { ok: true });
  assert.deepEqual(rl.check("a", 20), { ok: true });
  const blocked = rl.check("a", 30);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.ok === false && blocked.retryAfterSec, 1);
  assert.deepEqual(rl.check("b", 30), { ok: true }, "other keys are independent");
  assert.deepEqual(rl.check("a", 1001), { ok: true }, "window reset");
});

test("rate limiter never tracks more than maxKeys", () => {
  const rl = createRateLimiter({ limit: 1, windowMs: 10_000, maxKeys: 3 });
  for (let i = 0; i < 50; i++) rl.check(`k${i}`, i);
  // Newest key is still counted correctly after evictions.
  assert.equal(rl.check("k49", 60).ok, false);
});

test("clientKey prefers the first x-forwarded-for hop", () => {
  assert.equal(clientKey(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" })), "1.2.3.4");
  assert.equal(clientKey(new Headers({ "x-real-ip": "9.9.9.9" })), "9.9.9.9");
  assert.equal(clientKey(new Headers()), "unknown");
});

test("same-site check", () => {
  const h = (o: Record<string, string>) => new Headers(o);
  assert.equal(isSameSiteRequest(h({ host: "daftar.vercel.app" })), true, "no Origin");
  assert.equal(
    isSameSiteRequest(h({ host: "daftar.vercel.app", origin: "https://daftar.vercel.app" })),
    true,
  );
  assert.equal(
    isSameSiteRequest(
      h({ host: "internal", "x-forwarded-host": "daftar.uz", origin: "https://daftar.uz" }),
    ),
    true,
    "forwarded host wins",
  );
  assert.equal(
    isSameSiteRequest(h({ host: "daftar.vercel.app", origin: "https://evil.example" })),
    false,
  );
  assert.equal(
    isSameSiteRequest(h({ host: "daftar.vercel.app", "sec-fetch-site": "cross-site" })),
    false,
  );
  assert.equal(isSameSiteRequest(h({ host: "a.b", origin: "not a url" })), false);
});

test("mapLimit keeps order and respects the concurrency cap", async () => {
  let inFlight = 0;
  let peak = 0;
  const out = await mapLimit([30, 5, 20, 1, 10], 2, async (ms, i) => {
    inFlight++;
    peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, ms));
    inFlight--;
    return `${i}:${ms}`;
  });
  assert.deepEqual(out, ["0:30", "1:5", "2:20", "3:1", "4:10"]);
  assert.ok(peak <= 2, `peak was ${peak}`);
  assert.deepEqual(await mapLimit([], 3, async () => 1), []);
});

test("splitIntoChunks keeps short text whole and never cuts words", () => {
  assert.deepEqual(splitIntoChunks("  Salom   dunyo. "), ["Salom dunyo."]);
  assert.deepEqual(splitIntoChunks(""), []);

  const sentence = "Bu juda uzun gap bo'lib, ichida ko'p so'z bor";
  const long = Array.from({ length: 40 }, (_, i) => `${sentence} ${i}.`).join(" ");
  const chunks = splitIntoChunks(long, 200);
  assert.ok(chunks.length > 1);
  for (const c of chunks) {
    assert.ok(c.length <= 200, `chunk too long: ${c.length}`);
    assert.ok(c.endsWith("."), "chunks end on sentence boundaries");
  }
  assert.equal(chunks.join(" "), long.replace(/\s+/g, " ").trim());
});

test("splitIntoChunks breaks a single endless sentence on spaces", () => {
  const words = Array.from({ length: 300 }, (_, i) => `so'z${i}`).join(" ");
  const chunks = splitIntoChunks(words, 120);
  for (const c of chunks) assert.ok(c.length <= 120);
  assert.equal(chunks.join(" "), words);
});
