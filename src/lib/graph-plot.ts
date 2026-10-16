/**
 * Geometry for GraphSpec: ranges, ticks and SVG paths in pixels. Pure (no React),
 * so the maths of "what is drawn where" is unit-tested; the component only paints.
 *
 * The model supplies formulas, never coordinates. This module samples them, so a
 * plotted parabola is exactly as right as its formula.
 */
import { compileExpr } from "./math-expr.ts";
import type { GraphSpec } from "./lesson.ts";

export const PLOT_MARGIN = { left: 50, right: 18, top: 16, bottom: 40 } as const;
export const CURVE_COLORS = ["#1d4ed8", "#b42318", "#0f6b63"] as const;
const SAMPLES = 260;
const PX_CAP = 1e5;

export type Tick = { v: number; px: number; label: string };
export type PlotCurve = { d: string; color: string; label: string };
export type PlotPoint = { px: number; py: number; label?: string; anchor: "start" | "end"; dx: number; dy: number };
export type PlotGuide = { px: number; label: string };

export type PlotGeometry = {
  w: number;
  h: number;
  plot: { x0: number; y0: number; x1: number; y1: number; w: number; h: number };
  xr: [number, number];
  yr: [number, number];
  xTicks: Tick[];
  yTicks: Tick[];
  /** px of the y-axis line (x = 0) / x-axis line (y = 0); null when 0 is off-screen. */
  yAxisPx: number | null;
  xAxisPx: number | null;
  curves: PlotCurve[];
  line: string | null;
  points: PlotPoint[];
  vlines: PlotGuide[];
  hlines: PlotGuide[];
  /** Where the curve legend sits: the plot corner the curves cross least. */
  legend: { x: number; y: number; w: number; h: number } | null;
};

/** 1-2-5 step for roughly `target` ticks across `span`. */
export function niceStep(span: number, target = 5): number {
  const raw = span / Math.max(1, target);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const f = raw / mag;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nice * mag;
}

export function formatTick(v: number, step: number): string {
  const decimals = Math.min(6, Math.max(0, -Math.floor(Math.log10(step) + 1e-9)));
  const r = Number(v.toFixed(decimals));
  return Object.is(r, -0) ? "0" : String(r);
}

export function makeTicks(min: number, max: number, target: number): { v: number; step: number }[] {
  const step = niceStep(max - min, target);
  const first = Math.ceil(min / step - 1e-9);
  const last = Math.floor(max / step + 1e-9);
  const out: { v: number; step: number }[] = [];
  for (let k = first; k <= last && out.length < 40; k++) {
    out.push({ v: Number((k * step).toPrecision(12)), step });
  }
  return out;
}

/** "x^2" → "x²", "*" → "·", "pi" → "π": the default curve label. */
export function prettyExpr(expr: string): string {
  return expr
    .trim()
    .replace(/^(?:y|f\s*\(\s*x\s*\))\s*=\s*/i, "")
    .replace(/\^2\b/g, "²")
    .replace(/\^3\b/g, "³")
    .replace(/\*/g, "·")
    .replace(/\bpi\b/gi, "π");
}

const fmt = (n: number) => (Math.round(n * 10) / 10).toString();
const g0 = (x0: number, y0: number, x1: number, y1: number) => ({ x0, y0, x1, y1 });
const guideLabel = (name: string, v: number) => `${name} = ${formatTick(v, 0.01)}`;

type Sample = { x: number; y: number };

const okY = (y: number) => Number.isFinite(y) && Math.abs(y) < 1e9;

/**
 * Samples `fn` on [xmin, xmax]. Where the function stops being defined (the sides
 * of a circle written as y = ±sqrt(r² − x²), the start of sqrt(x), ln(x)) the exact
 * boundary is found by bisection, so such curves reach their true end instead of
 * stopping a few pixels short.
 */
function sample(fn: (x: number) => number, xmin: number, xmax: number): Sample[] {
  const out: Sample[] = [];
  const at = (x: number): Sample => {
    const y = fn(x);
    return { x, y: okY(y) ? y : Number.NaN };
  };
  const boundary = (good: number, bad: number): Sample => {
    let lo = good;
    let hi = bad;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (okY(fn(mid))) lo = mid;
      else hi = mid;
    }
    return at(lo);
  };
  let prev: Sample | null = null;
  for (let i = 0; i <= SAMPLES; i++) {
    const cur = at(xmin + ((xmax - xmin) * i) / SAMPLES);
    if (prev) {
      const a = Number.isFinite(prev.y);
      const b = Number.isFinite(cur.y);
      if (a && !b) out.push(boundary(prev.x, cur.x));
      else if (!a && b) out.push({ x: prev.x, y: Number.NaN }, boundary(cur.x, prev.x));
    }
    out.push(cur);
    prev = cur;
  }
  return out;
}

function fallbackXRange(spec: GraphSpec): [number, number] {
  const xs = [...spec.points.map((p) => p.x), ...(spec.vlines ?? [])];
  if (!xs.length) return [-10, 10];
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  // Measurements only (no formula): frame the data tightly.
  if (!spec.fn.length && hi > lo) {
    const pad = (hi - lo) * 0.12;
    return [lo - pad, hi + pad];
  }
  // A formula with a few marked points: show plenty of the curve around them.
  const span = Math.max(hi - lo, Math.abs(hi), Math.abs(lo), 10);
  const c = (lo + hi) / 2;
  return [c - span * 0.6, c + span * 0.6];
}

function autoYRange(spec: GraphSpec, samples: Sample[][]): [number, number] {
  const ys: number[] = [];
  for (const s of samples) for (const p of s) if (Number.isFinite(p.y)) ys.push(p.y);
  ys.sort((a, b) => a - b);
  let lo = Infinity;
  let hi = -Infinity;
  if (ys.length) {
    lo = ys[0];
    hi = ys[ys.length - 1];
    if (ys.length >= 30) {
      const q = (p: number) => ys[Math.min(ys.length - 1, Math.floor(p * (ys.length - 1)))];
      const l = q(0.02);
      const h = q(0.98);
      // Asymptotes (tan, 1/x) throw a few huge values: judge the range without them.
      if (h > l && hi - lo > 6 * (h - l)) {
        lo = l - (h - l) * 0.25;
        hi = h + (h - l) * 0.25;
      }
    }
  }
  for (const p of spec.points) {
    lo = Math.min(lo, p.y);
    hi = Math.max(hi, p.y);
  }
  for (const y of spec.hlines ?? []) {
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [-10, 10];
  if (hi - lo < 1e-9) {
    lo -= 1;
    hi += 1;
  }
  const range = hi - lo;
  return [lo - range * 0.15, hi + range * 0.08];
}

type Rect = { x0: number; y0: number; x1: number; y1: number };
const hit = (a: Rect, b: Rect) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const LABEL_CHAR_PX = 8;

/**
 * Puts each point label where it collides least: inside the plot, clear of the
 * legend, guide labels, other labels and markers, and off the curves. Tries a
 * handful of positions around the point and keeps the cheapest.
 */
function placeLabels(
  pts: { px: number; py: number; label?: string }[],
  plot: { x0: number; y0: number; x1: number; y1: number },
  curvePx: { px: number; py: number }[],
  occupied: Rect[],
): { anchor: "start" | "end"; dx: number; dy: number }[] {
  const markers: Rect[] = pts.map((p) => ({ x0: p.px - 8, y0: p.py - 8, x1: p.px + 8, y1: p.py + 8 }));
  const candidates = [
    { anchor: "start", dx: 10, dy: -10 },
    { anchor: "end", dx: -10, dy: -10 },
    { anchor: "start", dx: 10, dy: 22 },
    { anchor: "end", dx: -10, dy: 22 },
    { anchor: "start", dx: 13, dy: 5 },
    { anchor: "end", dx: -13, dy: 5 },
  ] as const;
  const taken: Rect[] = [...occupied];

  return pts.map((p, i) => {
    if (!p.label) return { anchor: "start", dx: 10, dy: -10 };
    const width = p.label.length * LABEL_CHAR_PX;
    let best: { c: (typeof candidates)[number]; pen: number; r: Rect } | null = null;
    for (const c of candidates) {
      const x = p.px + c.dx;
      const r: Rect = {
        x0: c.anchor === "start" ? x : x - width,
        x1: c.anchor === "start" ? x + width : x,
        y0: p.py + c.dy - 14,
        y1: p.py + c.dy + 5,
      };
      let pen = 0;
      if (r.x0 < plot.x0 || r.x1 > plot.x1 || r.y0 < plot.y0 || r.y1 > plot.y1) pen += 1000;
      for (const o of taken) if (hit(r, o)) pen += 400;
      markers.forEach((m, j) => {
        if (j !== i && hit(r, m)) pen += 300;
      });
      let onCurve = 0;
      for (const q of curvePx) if (q.px >= r.x0 && q.px <= r.x1 && q.py >= r.y0 && q.py <= r.y1) onCurve++;
      pen += Math.min(60, onCurve);
      if (!best || pen < best.pen) best = { c, pen, r };
    }
    taken.push(best!.r);
    return { anchor: best!.c.anchor, dx: best!.c.dx, dy: best!.c.dy };
  });
}

export function layoutGraph(spec: GraphSpec, w: number, h: number): PlotGeometry {
  const m = PLOT_MARGIN;
  const x0 = m.left;
  const y0 = m.top;
  const pw = Math.max(40, w - m.left - m.right);
  const ph = Math.max(40, h - m.top - m.bottom);
  const x1 = x0 + pw;
  const y1 = y0 + ph;

  const fns = spec.fn
    .map((c, i) => ({ fn: compileExpr(c.expr), c, i }))
    .filter((f): f is { fn: (x: number) => number; c: (typeof spec.fn)[number]; i: number } => !!f.fn);

  let [xmin, xmax] =
    spec.xmin !== undefined && spec.xmax !== undefined && spec.xmin < spec.xmax
      ? [spec.xmin, spec.xmax]
      : fallbackXRange(spec);

  let samples = fns.map((f) => sample(f.fn, xmin, xmax));
  let [ymin, ymax] =
    spec.ymin !== undefined && spec.ymax !== undefined && spec.ymin < spec.ymax
      ? [spec.ymin, spec.ymax]
      : autoYRange(spec, samples);

  if (spec.equal) {
    // Same pixels per unit on both axes, so circles look like circles.
    const s = Math.min(pw / (xmax - xmin), ph / (ymax - ymin));
    const nx = pw / s;
    const ny = ph / s;
    const cx = (xmin + xmax) / 2;
    const cy = (ymin + ymax) / 2;
    [xmin, xmax, ymin, ymax] = [cx - nx / 2, cx + nx / 2, cy - ny / 2, cy + ny / 2];
    samples = fns.map((f) => sample(f.fn, xmin, xmax));
  }

  const X = (v: number) => x0 + ((v - xmin) / (xmax - xmin)) * pw;
  const Y = (v: number) => y1 - ((v - ymin) / (ymax - ymin)) * ph;
  const clampPx = (v: number) => Math.max(-PX_CAP, Math.min(PX_CAP, v));

  const curvePx: { px: number; py: number }[] = [];
  const curves: PlotCurve[] = fns.map((f, k) => {
    let d = "";
    let pen = false;
    let prev: number | null = null;
    for (const p of samples[k]) {
      if (!Number.isFinite(p.y)) {
        pen = false;
        prev = null;
        continue;
      }
      const px = X(p.x);
      const py = clampPx(Y(p.y));
      curvePx.push({ px, py });
      // Asymptote: the curve leaves the view at the top and re-enters at the bottom (or vice versa).
      const crosses =
        prev !== null && ((prev < y0 && py > y1) || (prev > y1 && py < y0));
      if (!pen || crosses) {
        d += `M${fmt(px)} ${fmt(py)}`;
        pen = true;
      } else {
        d += `L${fmt(px)} ${fmt(py)}`;
      }
      prev = py;
    }
    return {
      d,
      color: f.c.color ?? CURVE_COLORS[f.i % CURVE_COLORS.length],
      label: f.c.label ?? `y = ${prettyExpr(f.c.expr)}`,
    };
  });

  const inView = (px: number, py: number) => px >= x0 - 1 && px <= x1 + 1 && py >= y0 - 1 && py <= y1 + 1;

  let line: string | null = null;
  if (spec.connect && spec.points.length >= 2) {
    const sorted = [...spec.points].sort((a, b) => a.x - b.x);
    line = sorted.map((p, i) => `${i ? "L" : "M"}${fmt(X(p.x))} ${fmt(clampPx(Y(p.y)))}`).join("");
  }

  const visible = spec.points
    .map((p) => ({ px: X(p.x), py: Y(p.y), label: p.label }))
    .filter((p) => inView(p.px, p.py));

  const vlines = (spec.vlines ?? [])
    .filter((v) => v >= xmin && v <= xmax)
    .map((v) => ({ px: X(v), label: guideLabel("x", v) }));
  const hlines = (spec.hlines ?? [])
    .filter((v) => v >= ymin && v <= ymax)
    .map((v) => ({ px: Y(v), label: guideLabel("y", v) }));

  // Things a point label must not cover: the legend and the guide-line captions.
  const occupied: Rect[] = [];
  for (const v of vlines) {
    occupied.push({ x0: v.px + 4, y0: y0 + 2, x1: v.px + 10 + v.label.length * 8, y1: y0 + 22 });
  }
  for (const v of hlines) {
    occupied.push({ x0: x1 - 10 - v.label.length * 8, y0: v.px - 22, x1: x1 - 4, y1: v.px - 2 });
  }

  // Legend: whichever corner the curves and guide captions cross least.
  let legend: PlotGeometry["legend"] = null;
  if (curves.length) {
    const longest = Math.max(...curves.map((c) => c.label.length));
    const lw = 36 + longest * 7.6;
    const lh = 8 + curves.length * 20;
    const corners = [
      { x: x0 + 6, y: y0 + 2 },
      { x: x1 - 6 - lw, y: y0 + 2 },
      { x: x0 + 6, y: y1 - 2 - lh },
      { x: x1 - 6 - lw, y: y1 - 2 - lh },
    ];
    let best = { c: corners[0], pen: Infinity };
    for (const c of corners) {
      const r: Rect = { x0: c.x, y0: c.y, x1: c.x + lw, y1: c.y + lh };
      let pen = 0;
      for (const q of curvePx) if (q.px >= r.x0 && q.px <= r.x1 && q.py >= r.y0 && q.py <= r.y1) pen++;
      for (const o of occupied) if (hit(r, o)) pen += 40;
      if (pen < best.pen) best = { c, pen };
    }
    legend = { x: best.c.x, y: best.c.y, w: lw, h: lh };
    occupied.push({ x0: legend.x, y0: legend.y, x1: legend.x + lw, y1: legend.y + lh });
  }

  const spots = placeLabels(visible, g0(x0, y0, x1, y1), curvePx, occupied);
  const points: PlotPoint[] = visible.map((p, i) => ({ ...p, ...spots[i] }));

  const xt = makeTicks(xmin, xmax, Math.max(3, Math.min(8, Math.round(pw / 90))));
  const yt = makeTicks(ymin, ymax, Math.max(3, Math.min(7, Math.round(ph / 50))));

  return {
    w,
    h,
    plot: { x0, y0, x1, y1, w: pw, h: ph },
    xr: [xmin, xmax],
    yr: [ymin, ymax],
    xTicks: xt.map((t) => ({ v: t.v, px: X(t.v), label: formatTick(t.v, t.step) })),
    yTicks: yt.map((t) => ({ v: t.v, px: Y(t.v), label: formatTick(t.v, t.step) })),
    yAxisPx: xmin <= 0 && xmax >= 0 ? X(0) : null,
    xAxisPx: ymin <= 0 && ymax >= 0 ? Y(0) : null,
    curves,
    line,
    points,
    vlines,
    hlines,
    legend,
  };
}
