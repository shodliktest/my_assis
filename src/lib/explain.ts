/**
 * Client-safe entry point for AI lessons. The heavy lifting (API keys, provider
 * failover) lives in `explain.server.ts` behind POST /api/explain, so no secret
 * and no server code ever reaches the browser bundle.
 */
import type { AnswerMode, Lesson } from "./lesson";

export type ExplainResult =
  | { ok: true; lesson: Lesson; mode: AnswerMode }
  | { ok: false; error: string };

/** A little longer than the server budget (50s) so the server answers first. */
const CLIENT_TIMEOUT_MS = 58_000;

function isExplainResult(value: unknown): value is ExplainResult {
  if (typeof value !== "object" || value === null) return false;
  const v = value as { ok?: unknown; lesson?: unknown; error?: unknown };
  if (v.ok === true) return typeof v.lesson === "object" && v.lesson !== null;
  return v.ok === false && typeof v.error === "string";
}

export async function explainQuestion({
  data,
}: {
  data: { question: string; mode?: AnswerMode };
}): Promise<ExplainResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: controller.signal,
    });
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      /* non-JSON body: a platform error page (e.g. 504) */
    }
    if (isExplainResult(body)) return body;
    return {
      ok: false,
      error:
        res.status >= 500
          ? "Server band. Birozdan so'ng qayta urinib ko'ring."
          : "Javob olinmadi. Birozdan so'ng qayta urinib ko'ring.",
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: "Javob kechikdi. Qayta urinib ko'ring." };
    }
    return { ok: false, error: "Tarmoq xatosi yuz berdi. Birozdan so'ng qayta urinib ko'ring." };
  } finally {
    clearTimeout(timer);
  }
}
