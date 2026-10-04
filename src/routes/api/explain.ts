import { createFileRoute } from "@tanstack/react-router";
import { parseExplainInput, runExplain } from "@/lib/explain.server";
import { clientKey, createRateLimiter, isSameSiteRequest } from "@/lib/server-guards";

// Per function instance, per visitor. Generous for real use (a lesson is one
// request), tight enough to stop a script from burning the AI quota.
const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

const NO_STORE = { "Cache-Control": "no-store" } as const;

function fail(error: string, status: number, extra: Record<string, string> = {}) {
  return Response.json({ ok: false, error }, { status, headers: { ...NO_STORE, ...extra } });
}

export const Route = createFileRoute("/api/explain")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isSameSiteRequest(request.headers)) {
          return fail("So'rov rad etildi.", 403);
        }
        const gate = limiter.check(clientKey(request.headers));
        if (!gate.ok) {
          return fail("So'rovlar ko'payib ketdi. Bir daqiqadan so'ng qayta urinib ko'ring.", 429, {
            "Retry-After": String(gate.retryAfterSec),
          });
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return fail("JSON kerak", 400);
        }
        const input = parseExplainInput(body);
        if (!input) {
          return fail("Savol 2 dan 400 belgigacha bo'lishi kerak.", 400);
        }

        try {
          const result = await runExplain(input);
          return Response.json(result, { headers: NO_STORE });
        } catch (err) {
          console.error("[api/explain] unexpected failure:", err);
          return fail("Javob olinmadi. Birozdan so'ng qayta urinib ko'ring.", 500);
        }
      },
    },
  },
});
