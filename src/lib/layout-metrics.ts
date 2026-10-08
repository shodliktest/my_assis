/**
 * Sizes of board elements in pixels, shared by the layout engine (lesson.ts) and
 * the renderers (board-items.tsx) so what is reserved is exactly what is drawn.
 * Pure and dependency-free.
 *
 * Text is measured through a pluggable measurer. In the browser the app installs
 * a canvas measurer that uses the real handwriting font (text-measure.ts), so boxes
 * hug their text and rows never overlap. Without it (tests, server) widths are
 * estimated at 0.45em per character, which is on the safe side for Caveat (~0.4em).
 */

export type SizeName = "sm" | "md" | "lg" | "xl";
export const FONT_PX: Record<SizeName, number> = { sm: 18, md: 22, lg: 26, xl: 34 };

export type TextMeasurer = (text: string, fontPx: number, weight: number) => number;

const estimateWidth: TextMeasurer = (text, fontPx) => text.length * fontPx * 0.45;
let measurer: TextMeasurer = estimateWidth;

/** Install a real measurer (browser canvas) or pass null to go back to the estimate. */
export function setTextMeasurer(m: TextMeasurer | null): void {
  measurer = m ?? estimateWidth;
}

export const textWidth = (text: string, fontPx: number, weight = 500): number =>
  measurer(text, fontPx, weight);

export const GRAPH_H = 312;
const MONO_EM = 0.6;

/** Greedy word wrap with the active measurer: line count and the widest line. */
export function wrapText(
  text: string | undefined,
  fontPx: number,
  maxW: number,
  weight = 500,
): { lines: number; width: number } {
  const words = (text ?? "").split(/\s+/).filter(Boolean);
  if (!words.length || maxW <= 0) return { lines: 1, width: 0 };
  const space = textWidth(" ", fontPx, weight) || fontPx * 0.25;
  let lines = 1;
  let cur = 0;
  let widest = 0;
  for (const word of words) {
    const w = textWidth(word, fontPx, weight);
    if (cur === 0) cur = w;
    else if (cur + space + w <= maxW) cur += space + w;
    else {
      widest = Math.max(widest, cur);
      lines++;
      cur = w;
    }
    if (w > maxW) {
      // A single word wider than the box breaks inside the word.
      const extra = Math.ceil(w / maxW) - 1;
      lines += extra;
      cur = w - extra * maxW;
      widest = maxW;
    }
  }
  return { lines, width: Math.min(maxW, Math.max(widest, cur)) };
}

export type Box = { w: number; h: number };

const lineH = (fontPx: number) => Math.round(fontPx * 1.375);

/** A text row: as wide as its text when it fits on one line, otherwise the full width. */
export function textBox(text: string | undefined, size: SizeName | undefined, maxW: number, weight = 500): Box {
  const f = FONT_PX[size ?? "sm"];
  const r = wrapText(text, f, maxW, weight);
  return { w: r.lines > 1 ? maxW : Math.min(maxW, Math.ceil(r.width) + 10), h: r.lines * lineH(f) + 4 };
}

export function textHeight(text: string | undefined, size: SizeName | undefined, widthPx: number): number {
  return textBox(text, size, widthPx).h;
}

export function formulaBox(text: string | undefined, maxW: number): Box {
  const r = wrapText(text, 24, maxW - 28, 600);
  return { w: r.lines > 1 ? maxW : Math.min(maxW, Math.ceil(r.width) + 44), h: Math.max(56, r.lines * 34 + 22) };
}

export function calloutBox(text: string | undefined, maxW: number): Box {
  const r = wrapText(text, 18, maxW - 28, 500);
  return { w: r.lines > 1 ? maxW : Math.min(maxW, Math.ceil(r.width) + 30), h: r.lines * 25 + 18 };
}

/** Flex-wrap rows of pill chips. */
export function chipsBox(chips: string[], maxW: number): Box {
  let rows = 1;
  let x = 0;
  let widest = 0;
  for (const c of chips) {
    const w = textWidth(c, 17, 500) + 24;
    if (x > 0 && x + w > maxW) {
      rows++;
      x = 0;
    }
    x += w + 6;
    widest = Math.max(widest, x - 6);
  }
  return { w: rows > 1 ? maxW : Math.min(maxW, Math.ceil(widest)), h: rows * 26 + (rows - 1) * 6 };
}

const CELL_PAD = 20;

/** Natural column widths, shrunk proportionally when the table is wider than the space. */
export function tableColumns(rows: string[][] | undefined, maxW: number): number[] {
  const data = rows?.length ? rows : [[""], [""], [""]];
  const cols = Math.max(1, ...data.map((r) => r.length));
  const natural = Array.from({ length: cols }, (_, j) =>
    Math.max(48, ...data.map((r, i) => textWidth(String(r[j] ?? ""), 18, i === 0 ? 600 : 500) + CELL_PAD)),
  );
  const total = natural.reduce((a, b) => a + b, 0);
  if (total <= maxW) return natural;
  return natural.map((n) => (n / total) * maxW);
}

/** Row heights follow how many lines each cell wraps to at its column width. */
export function tableBox(rows: string[][] | undefined, maxW: number): Box {
  const data = rows?.length ? rows : [[""], [""], [""]];
  const cols = tableColumns(rows, maxW);
  let h = 2;
  data.forEach((row, i) => {
    const lines = Math.max(
      1,
      ...cols.map((cw, j) => wrapText(String(row[j] ?? ""), 18, Math.max(24, cw - CELL_PAD), i === 0 ? 600 : 500).lines),
    );
    h += lines * 23 + 13;
  });
  return { w: Math.min(maxW, Math.ceil(cols.reduce((a, b) => a + b, 0))), h };
}

export function tableHeight(rows: string[][] | undefined, widthPx: number): number {
  return tableBox(rows, widthPx).h;
}

export function codeHeight(text: string | undefined): number {
  const lines = Math.min(14, Math.max(1, (text ?? "").split("\n").length));
  return lines * 24 + 28;
}

export function codeBox(text: string | undefined, maxW: number): Box {
  const longest = Math.max(1, ...(text ?? "").split("\n").map((l) => l.length));
  return { w: Math.min(maxW, Math.ceil(longest * 16 * MONO_EM) + 36), h: codeHeight(text) };
}

export function graphHeight(widthPx: number): number {
  return Math.round(Math.max(220, Math.min(GRAPH_H, widthPx * 0.8)));
}

// ---- flow: steps joined by arrows ------------------------------------------------

export const FLOW_ARROW_W = 28;
export const FLOW_NODE_H = 80;

export function flowMetrics(n: number, widthPx: number) {
  const count = Math.max(1, Math.min(5, n));
  const nodeW = (widthPx - FLOW_ARROW_W * (count - 1)) / count;
  // Too narrow for a row (side-by-side column): stack the steps top to bottom.
  const vertical = nodeW < 86;
  return {
    count,
    vertical,
    nodeW,
    h: vertical ? count * 42 + (count - 1) * 22 : FLOW_NODE_H + 16,
  };
}

// ---- bars: bar chart --------------------------------------------------------------

export function barsMetrics(rows: string[][] | undefined, widthPx: number) {
  const n = Math.min(6, Math.max(1, rows?.length ?? 3));
  const longest = Math.max(0, ...(rows ?? []).slice(0, n).map((r) => String(r[0] ?? "").length));
  // Few bars with short names read best as columns; long names need rows.
  const vertical = longest <= 12 && widthPx >= 300 && n <= 6;
  return { count: n, vertical, h: vertical ? 244 : n * 38 + 8 };
}

// ---- timeline ---------------------------------------------------------------------

const TL_GAP = 12;
const TL_HEAD = 62; // date label + axis + connector

export function timelineMetrics(rows: string[][] | undefined, widthPx: number) {
  const data = (rows ?? []).slice(0, 5);
  const n = Math.max(1, data.length);
  const cardW = (widthPx - TL_GAP * (n - 1)) / n;
  const vertical = cardW < 130;
  const title = (r: string[]) => String(r[1] ?? "");
  const detail = (r: string[]) => String(r[2] ?? "");
  if (!vertical) {
    const titleLines = Math.max(1, ...data.map((r) => wrapText(title(r), 18, cardW - 18, 600).lines));
    const hasDetail = data.some((r) => detail(r).length > 0);
    const detailLines = hasDetail ? Math.max(1, ...data.map((r) => wrapText(detail(r), 15, cardW - 18).lines)) : 0;
    const cardH = 20 + titleLines * 25 + (hasDetail ? detailLines * 21 + 4 : 0);
    return { count: n, vertical, cardW, cardH, h: TL_HEAD + cardH };
  }
  // Vertical: date on the left, card on the right, one row per event.
  const w = widthPx - 96;
  const rowHs = data.map((r) => {
    const t = wrapText(title(r), 18, w - 18, 600).lines;
    const d = detail(r) ? wrapText(detail(r), 15, w - 18).lines : 0;
    return Math.max(52, 20 + t * 25 + (d ? d * 21 + 4 : 0));
  });
  const total = rowHs.reduce((a, b) => a + b, 0) + TL_GAP * (n - 1);
  return { count: n, vertical, cardW: w, cardH: 0, rowHs, h: total };
}

// ---- icons: a row of pictures with captions ----------------------------------------

export const ICON_PX = 56;
export const ICON_ARROW_W = 26;

export function iconsMetrics(rows: string[][] | undefined, widthPx: number, arrows: boolean) {
  const data = (rows ?? []).slice(0, 5);
  const n = Math.max(1, data.length);
  const cellW = (widthPx - (arrows ? ICON_ARROW_W * (n - 1) : 0)) / n;
  const labelLines = Math.min(3, Math.max(1, ...data.map((r) => wrapText(String(r[1] ?? ""), 17, cellW - 8, 600).lines)));
  return { count: n, cellW, h: ICON_PX + 14 + labelLines * 22 + 8 };
}
