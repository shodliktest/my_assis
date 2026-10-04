/**
 * Turns whatever an LLM returned into a safe `Lesson`.
 *
 * Language models routinely overshoot length limits, return numbers as strings,
 * or skip optional fields. A strict schema would throw away an otherwise good
 * lesson for that; here every field is clamped/coerced and only truly unusable
 * pieces are dropped. Pure and dependency-free so it can be tested with node.
 */
import { DRAW_KINDS, normalizeLesson, type DrawItem, type DrawKind, type Lesson } from "./lesson.ts";

type Rec = Record<string, unknown>;

const SIZES = new Set(["sm", "md", "lg", "xl"]);
const KINDS = new Set<string>(DRAW_KINDS);

function isRec(v: unknown): v is Rec {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown, max: number): string | undefined {
  if (typeof v === "string") {
    const t = v.trim();
    return t ? t.slice(0, max) : undefined;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v).slice(0, max);
  return undefined;
}

function num(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v === "string") {
    const t = v.trim().replace(/%$/, "");
    if (t === "") return undefined;
    const n = Number(t);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function sanitizeItem(raw: unknown, beatIndex: number, itemIndex: number): DrawItem | null {
  if (!isRec(raw)) return null;
  const kind = (typeof raw.kind === "string" && KINDS.has(raw.kind) ? raw.kind : "text") as DrawKind;

  const rows = Array.isArray(raw.rows)
    ? raw.rows
        .filter(Array.isArray)
        .slice(0, 8)
        .map((row) => (row as unknown[]).slice(0, 5).map((cell) => str(cell, 48) ?? ""))
    : [];
  const chips = Array.isArray(raw.chips)
    ? raw.chips
        .slice(0, 12)
        .map((c) => str(c, 32))
        .filter((c): c is string => !!c)
    : [];

  return {
    id: str(raw.id, 40) ?? `i-${beatIndex}-${itemIndex}`,
    kind,
    text: str(raw.text, 220),
    x: num(raw.x) ?? 0,
    y: num(raw.y) ?? 0,
    w: num(raw.w),
    h: num(raw.h),
    x2: num(raw.x2),
    y2: num(raw.y2),
    color: str(raw.color, 16) ?? "#1e3a5f",
    fill: str(raw.fill, 16),
    size: typeof raw.size === "string" && SIZES.has(raw.size) ? (raw.size as DrawItem["size"]) : undefined,
    icon: str(raw.icon, 24),
    rows: rows.length ? rows : undefined,
    chips: chips.length ? chips : undefined,
  };
}

/** Returns a normalized lesson, or null when nothing usable is left. */
export function sanitizeLessonPayload(payload: unknown): Lesson | null {
  if (!isRec(payload)) return null;
  const rawBeats = Array.isArray(payload.beats) ? payload.beats.slice(0, 14) : [];

  const beats = rawBeats.flatMap((raw, bi) => {
    if (!isRec(raw)) return [];
    const speech = str(raw.speech, 900) ?? str(raw.caption, 900);
    if (!speech) return [];
    const items = (Array.isArray(raw.items) ? raw.items.slice(0, 18) : []).flatMap((it, ii) => {
      const item = sanitizeItem(it, bi, ii);
      return item ? [item] : [];
    });
    if (!items.length) return [];
    return [
      {
        id: str(raw.id, 40) ?? `beat-${bi}`,
        speech,
        caption: str(raw.caption, 900) ?? speech,
        items,
      },
    ];
  });

  if (!beats.length) return null;
  return normalizeLesson({ title: str(payload.title, 100) ?? "Dars", beats });
}

/** Pull the JSON object out of a model reply (code fences, <think> blocks, chatter). */
export function extractJson(text: string): unknown {
  const withoutThink = text.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const trimmed = withoutThink.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced?.[1]?.trim() ?? trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("JSON topilmadi");
  return JSON.parse(body.slice(start, end + 1));
}
