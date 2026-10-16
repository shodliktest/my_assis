import { createFileRoute } from "@tanstack/react-router";
import { BUILD_ID } from "@/lib/build-info";
import { synthesizeParts, synthesizeUtterance } from "@/lib/edge-tts.server";
import { clientKey, createDeadline, createRateLimiter, isSameSiteRequest } from "@/lib/server-guards";

type TtsBody = {
  text?: string;
  voice?: string;
  lang?: string;
  parts?: { text?: string; voice?: string; lang?: string; phonetic?: boolean }[];
};

/** A lesson beat is ~700 chars; these caps only stop abusive payloads. */
const MAX_PARTS = 12;
const MAX_TOTAL_CHARS = 6000;

// One lesson = one request per beat (+ replays), so this is deliberately roomy.
const limiter = createRateLimiter({ limit: 90, windowMs: 60_000 });
// The health probe opens a real connection to Microsoft: allow only a few per minute.
const probeLimiter = createRateLimiter({ limit: 6, windowMs: 60_000 });

function fail(error: string, status: number, extra: Record<string, string> = {}) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store", ...extra } },
  );
}

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      /**
       * Health probe: open /api/tts in the browser. It really asks Microsoft for one word and
       * says whether the neural voice works from this deployment, and if not, why.
       */
      GET: async ({ request }) => {
        if (!isSameSiteRequest(request.headers)) return fail("So'rov rad etildi.", 403);
        const gate = probeLimiter.check(clientKey(request.headers));
        if (!gate.ok) {
          return fail("Juda tez-tez tekshirildi.", 429, { "Retry-After": String(gate.retryAfterSec) });
        }
        const started = Date.now();
        const head = { "Cache-Control": "no-store" };
        try {
          const audio = await synthesizeUtterance("Salom", "uz-UZ-MadinaNeural", createDeadline(15_000), true, false);
          return Response.json(
            {
              ok: true,
              engine: "Microsoft Edge neural (uz-UZ-MadinaNeural / uz-UZ-SardorNeural)",
              ms: Date.now() - started,
              bytes: audio.length,
              build: BUILD_ID,
            },
            { headers: head },
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : "Ovoz yaratilmadi";
          console.error("[tts] health probe failed:", message);
          return Response.json(
            { ok: false, error: message, ms: Date.now() - started, build: BUILD_ID },
            { status: 502, headers: head },
          );
        }
      },
      POST: async ({ request }) => {
        if (!isSameSiteRequest(request.headers)) return fail("So'rov rad etildi.", 403);
        const gate = limiter.check(clientKey(request.headers));
        if (!gate.ok) {
          return fail("So'rovlar ko'payib ketdi.", 429, {
            "Retry-After": String(gate.retryAfterSec),
          });
        }

        let body: TtsBody = {};
        try {
          body = (await request.json()) as TtsBody;
        } catch {
          return fail("JSON kerak", 400);
        }

        const parts = Array.isArray(body.parts) ? body.parts : [];
        const totalChars = parts.reduce((n, p) => n + String(p?.text ?? "").length, 0);
        if (parts.length > MAX_PARTS || totalChars > MAX_TOTAL_CHARS) {
          return fail("Matn juda uzun", 413);
        }
        if (!parts.length && String(body.text ?? "").length > MAX_TOTAL_CHARS) {
          return fail("Matn juda uzun", 413);
        }

        try {
          const audio = parts.length
            ? await synthesizeParts(
                parts.map((part) => ({
                  text: String(part?.text ?? ""),
                  voice: part?.voice,
                  lang: part?.lang,
                  phonetic: part?.phonetic === true,
                })),
              )
            : await synthesizeUtterance(String(body.text ?? "").trim(), body.voice);
          return new Response(new Uint8Array(audio), {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
            },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Ovoz yaratilmadi";
          const status = message === "Matn bosh" || message === "Matn juda qisqa" ? 400 : 502;
          // Visible in the Vercel function logs.
          if (status === 502) console.error("[tts] synthesis failed:", message);
          return fail(message, status);
        }
      },
    },
  },
});
