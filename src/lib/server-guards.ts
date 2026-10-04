/**
 * Small, dependency-free helpers shared by the server routes (/api/explain,
 * /api/tts). Kept free of framework imports so they can be unit-tested with
 * plain `node --test`.
 *
 * NOTE (serverless): the rate limiter lives in the memory of one function
 * instance. It stops scripted loops and accidental hammering; it is not a
 * global quota. For a hard global limit put Vercel Firewall rate limiting or
 * an external store (Upstash/Redis) in front.
 */

export type Deadline = {
  /** Milliseconds left until the budget is spent (never negative). */
  remaining: () => number;
  expired: () => boolean;
};

/** A wall-clock budget, so retries/failover can never outlive the function. */
export function createDeadline(totalMs: number, now: () => number = Date.now): Deadline {
  const end = now() + totalMs;
  return {
    remaining: () => Math.max(0, end - now()),
    expired: () => now() >= end,
  };
}

export type RateLimiter = {
  check: (key: string, now?: number) => { ok: true } | { ok: false; retryAfterSec: number };
};

/** Fixed-window counter per key with a hard cap on tracked keys. */
export function createRateLimiter(opts: {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}): RateLimiter {
  const { limit, windowMs, maxKeys = 5000 } = opts;
  const hits = new Map<string, { count: number; resetAt: number }>();

  function sweep(now: number) {
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }

  return {
    check(key, now = Date.now()) {
      let entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        if (hits.size >= maxKeys) {
          sweep(now);
          // Still full of live entries: drop the oldest instead of growing forever.
          if (hits.size >= maxKeys) {
            const oldest = hits.keys().next().value;
            if (oldest !== undefined) hits.delete(oldest);
          }
        }
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(key, entry);
      }
      entry.count += 1;
      if (entry.count > limit) {
        return { ok: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
      }
      return { ok: true };
    },
  };
}

/** Best-effort caller identity behind Vercel's proxy. */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Rejects browser requests that originate from another site (hot-linking the
 * endpoints from someone else's page). Requests without Origin (curl, server to
 * server) are not blocked here — the rate limiter covers those.
 */
export function isSameSiteRequest(headers: Headers): boolean {
  const fetchSite = headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return false;
  const origin = headers.get("origin");
  if (!origin) return true;
  const host = (headers.get("x-forwarded-host") ?? headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  if (!host) return true;
  try {
    return new URL(origin).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

/** Run `fn` over `items` with at most `limit` in flight; result order is preserved. */
export async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker);
  await Promise.all(workers);
  return results;
}

/**
 * Split long text into chunks of at most `max` characters, preferring sentence
 * ends, then spaces, so speech is never cut in the middle of a word.
 */
export function splitIntoChunks(text: string, max = 900): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= max) return [clean];

  const sentences = clean.split(/(?<=[.!?…])\s+/);
  const chunks: string[] = [];
  let current = "";

  const push = () => {
    if (current) chunks.push(current);
    current = "";
  };

  for (const sentence of sentences) {
    if (sentence.length > max) {
      push();
      // A single over-long sentence: break on spaces.
      let rest = sentence;
      while (rest.length > max) {
        let cut = rest.lastIndexOf(" ", max);
        if (cut < max * 0.5) cut = max;
        chunks.push(rest.slice(0, cut).trim());
        rest = rest.slice(cut).trim();
      }
      current = rest;
      continue;
    }
    if (current && current.length + 1 + sentence.length > max) push();
    current = current ? `${current} ${sentence}` : sentence;
  }
  push();
  return chunks.filter(Boolean);
}
