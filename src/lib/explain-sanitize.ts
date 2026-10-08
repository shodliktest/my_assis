/**
 * Turns whatever an LLM returned into a safe `Lesson`.
 *
 * Language models routinely overshoot length limits, return numbers as strings,
 * or skip optional fields. A strict schema would throw away an otherwise good
 * lesson for that; here every field is clamped/coerced and only truly unusable
 * pieces are dropped. Pure and dependency-free so it can be tested with node.
 */
import {
  DRAW_KINDS,
  normalizeLesson,
  type DrawItem,
  type DrawKind,
  type GraphCurve,
  type GraphPoint,
  type GraphSpec,
  type Lesson,
} from "./lesson.ts";
import { isPictogramId } from "./icon-ids.ts";
import { clampSpeech, displayText } from "./spoken.ts";
import { compileExpr, evalConst } from "./math-expr.ts";

type Rec = Record<string, unknown>;

const SIZES = new Set(["sm", "md", "lg", "xl"]);
const KINDS = new Set<string>(DRAW_KINDS);

function isRec(v: unknown): v is Rec {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Displayed text: any {{shown|said}} marker is resolved to the correct spelling. */
function str(v: unknown, max: number): string | undefined {
  if (typeof v === "string") {
    const t = displayText(v).trim();
    return t ? t.slice(0, max) : undefined;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v).slice(0, max);
  return undefined;
}

/** Text for the voice: keeps {{shown|said}} markers (repaired if cut off). */
function speechStr(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = clampSpeech(v, max);
  return t ? t : undefined;
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

const GRAPH_LIMIT = 1e6;
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** A number, or a constant expression such as "2*pi" / "-10" / "1/3". */
function constNum(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? evalConst(v) : null;
  return n != null && Number.isFinite(n) && Math.abs(n) <= GRAPH_LIMIT ? n : undefined;
}

function numList(v: unknown, max: number): number[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .slice(0, max)
    .map(constNum)
    .filter((n): n is number => n !== undefined);
  return out.length ? out : undefined;
}

function flag(v: unknown): boolean | undefined {
  if (v === true || v === "true") return true;
  return undefined;
}

/** True when `fn` is finite at no fewer than 3 sample x in [lo, hi]. */
function plottable(fn: (x: number) => number, lo: number, hi: number): boolean {
  let finite = 0;
  for (let i = 0; i <= 80; i++) {
    const y = fn(lo + ((hi - lo) * i) / 80);
    if (Number.isFinite(y) && Math.abs(y) < 1e9 && ++finite >= 3) return true;
  }
  return false;
}

/**
 * Validates a model-written graph. Curves with unparseable formulas are dropped,
 * not trusted; null when neither a curve nor a point survives.
 */
export function sanitizeGraph(raw: unknown): GraphSpec | null {
  if (!isRec(raw)) return null;

  let xmin = constNum(raw.xmin);
  let xmax = constNum(raw.xmax);
  if (xmin === undefined || xmax === undefined || !(xmin < xmax)) {
    xmin = undefined;
    xmax = undefined;
  }
  let ymin = constNum(raw.ymin);
  let ymax = constNum(raw.ymax);
  if (ymin === undefined || ymax === undefined || !(ymin < ymax)) {
    ymin = undefined;
    ymax = undefined;
  }

  const rawFns = Array.isArray(raw.fn) ? raw.fn : raw.fn != null ? [raw.fn] : [];
  const fn: GraphCurve[] = [];
  // Look at a few more entries than we keep, so one bad formula does not cost a good one.
  for (const f of rawFns.slice(0, 8)) {
    if (fn.length >= 3) break;
    const expr = typeof f === "string" ? f : isRec(f) && typeof f.expr === "string" ? f.expr : null;
    if (!expr) continue;
    const compiled = compileExpr(expr);
    if (!compiled || !plottable(compiled, xmin ?? -20, xmax ?? 20)) continue;
    const label = isRec(f) ? str(f.label, 40) : undefined;
    const color = isRec(f) && typeof f.color === "string" && HEX.test(f.color) ? f.color : undefined;
    fn.push({ expr: expr.trim().slice(0, 160), label, color });
  }

  const rawPoints = Array.isArray(raw.points) ? raw.points : [];
  const points: GraphPoint[] = [];
  for (const p of rawPoints.slice(0, 12)) {
    const x = Array.isArray(p) ? constNum(p[0]) : isRec(p) ? constNum(p.x) : undefined;
    const y = Array.isArray(p) ? constNum(p[1]) : isRec(p) ? constNum(p.y) : undefined;
    if (x === undefined || y === undefined) continue;
    points.push({ x, y, label: isRec(p) ? str(p.label, 32) : undefined });
  }

  if (!fn.length && !points.length) return null;

  return {
    fn,
    points,
    xmin,
    xmax,
    ymin,
    ymax,
    vlines: numList(raw.vlines, 4),
    hlines: numList(raw.hlines, 4),
    connect: flag(raw.connect),
    equal: flag(raw.equal),
    xlabel: str(raw.xlabel, 24),
    ylabel: str(raw.ylabel, 24),
  };
}

/** Code keeps its newlines and indentation; capped at 14 lines of 58 characters (825 with newlines). */
function codeText(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  let text = v;
  // Some models double-escape: a literal backslash-n instead of a newline.
  if (!text.includes("\n") && text.includes("\\n")) text = text.replace(/\\n/g, "\n");
  const lines = text.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  if (!lines.length) return undefined;
  return lines
    .slice(0, 14)
    .map((l) => l.trimEnd().slice(0, 58))
    .join("\n")
    .slice(0, 850);
}

function sanitizeItem(raw: unknown, beatIndex: number, itemIndex: number): DrawItem | null {
  if (!isRec(raw)) return null;
  const kind = (typeof raw.kind === "string" && KINDS.has(raw.kind) ? raw.kind : "text") as DrawKind;

  const rows = Array.isArray(raw.rows)
    ? raw.rows
        .filter(Array.isArray)
        .slice(0, 10)
        .map((row) => (row as unknown[]).slice(0, 5).map((cell) => str(cell, 48) ?? ""))
    : [];
  const chips = Array.isArray(raw.chips)
    ? raw.chips
        .slice(0, 12)
        .map((c) => str(c, 32))
        .filter((c): c is string => !!c)
    : [];

  // Fields may sit inside `graph` (preferred) or flat on the item.
  const graph = kind === "graph" ? sanitizeGraph(isRec(raw.graph) ? raw.graph : raw) : null;
  if (kind === "graph" && !graph) return null;
  const code = kind === "code" ? codeText(raw.text) : undefined;
  if (kind === "code" && !code) return null;
  // Data-driven elements with no data would only reserve empty space.
  if ((kind === "timeline" || kind === "icons" || kind === "bars") && !rows.some((r) => r.some((c) => c))) return null;
  if (kind === "flow" && !chips.length && !str(raw.text, 220)) return null;

  return {
    id: str(raw.id, 40) ?? `i-${beatIndex}-${itemIndex}`,
    kind,
    text: kind === "code" ? code : str(raw.text, 220),
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
    rows: rows.length
      ? kind === "icons"
        ? rows.map(([id, ...rest]) => [isPictogramId(id.trim().toLowerCase()) ? id.trim().toLowerCase() : "idea", ...rest])
        : rows
      : undefined,
    chips: chips.length ? chips : undefined,
    graph: graph ?? undefined,
    side: kind === "box" && (raw.side === "left" || raw.side === "right") ? raw.side : undefined,
  };
}

/** Returns a normalized lesson, or null when nothing usable is left. */
export function sanitizeLessonPayload(payload: unknown): Lesson | null {
  if (!isRec(payload)) return null;
  const rawBeats = Array.isArray(payload.beats) ? payload.beats.slice(0, 14) : [];

  const beats = rawBeats.flatMap((raw, bi) => {
    if (!isRec(raw)) return [];
    const speech = speechStr(raw.speech, 900) ?? str(raw.caption, 900);
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
        caption: str(raw.caption, 900) ?? displayText(speech),
        items,
      },
    ];
  });

  if (!beats.length) return null;
  const lesson = normalizeLesson({ title: str(payload.title, 100) ?? "Dars", beats });
  // Model-supplied ids can repeat ("box", "b1"); the board needs every id unique.
  return {
    ...lesson,
    beats: lesson.beats.map((beat, bi) => ({
      ...beat,
      id: `b${bi}`,
      items: beat.items.map((item, ii) => ({ ...item, id: `b${bi}-i${ii}` })),
    })),
  };
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
