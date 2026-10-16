/**
 * "Qizil ruchka": a written sentence whose mistakes are crossed out and corrected in place.
 *
 *   She [[go>>goes]] to school.     → "go" is struck out in red, "goes" is written above it in green
 *   I [[>>am]] happy.               → nothing to strike: a caret marks where the word is missing
 *   He [[is>>]] plays football.     → "is" is struck out, nothing replaces it
 *
 * The model writes this markup inside the `text` of a `fix` item; the board draws it
 * (board-items.tsx) and the layout engine measures it (layout-metrics.ts). Everything
 * here is pure and dependency-free, so it is tested with plain node.
 */

export type FixPart =
  | { kind: "text"; text: string }
  | { kind: "fix"; wrong: string; right: string };

/** One breakable piece of a sentence: words and corrections that touch each other stay together. */
export type FixAtom =
  | { type: "word"; text: string }
  | { type: "unit"; wrong: string; right: string; index: number };

/** Longest struck-out / corrected piece (characters). Longer ones cannot sit above the line. */
export const FIX_SIDE_MAX = 26;
/** Corrections per sentence. */
export const FIX_MAX_MARKS = 5;
/** Longest `text` of a fix item, markup included. */
export const FIX_TEXT_MAX = 200;

// wrong >> right   (->, => and → are accepted too: models vary)
const MARK = /\[\[([^[\]]*?)(?:>>|->|=>|→)([^[\]]*?)\]\]/g;
const STRAY = /\[\[|\]\]/g;

/** Splits text into plain runs and corrections. Stray "[[" / "]]" never reach the board. */
export function parseFix(text: string): FixPart[] {
  const parts: FixPart[] = [];
  const pushText = (t: string) => {
    const clean = t.replace(STRAY, "");
    if (clean) parts.push({ kind: "text", text: clean });
  };
  let last = 0;
  for (const m of text.matchAll(MARK)) {
    pushText(text.slice(last, m.index));
    parts.push({ kind: "fix", wrong: m[1].trim(), right: m[2].trim() });
    last = (m.index ?? 0) + m[0].length;
  }
  pushText(text.slice(last));
  return parts;
}

export function fixCount(text: string): number {
  return parseFix(text).filter((p) => p.kind === "fix").length;
}

const tidy = (s: string) => s.replace(/\s+/g, " ").replace(/\s+([.,!?;:])/g, "$1").trim();

/** The sentence with every correction resolved: `right` is the corrected text, `wrong` the original. */
export function fixPlain(text: string, side: "right" | "wrong"): string {
  // Plain runs keep their own spacing, so the pieces are joined as they are.
  return tidy(parseFix(text).map((p) => (p.kind === "text" ? p.text : p[side])).join(""));
}

function serialize(parts: FixPart[]): string {
  return parts.map((p) => (p.kind === "text" ? p.text : `[[${p.wrong}>>${p.right}]]`)).join("");
}

/**
 * Repairs model output so the board can always draw it: unusable marks (identical sides,
 * pieces too long to sit above the line, more than FIX_MAX_MARKS) fall back to plain
 * corrected text, and the cut at `maxLen` never lands inside a mark.
 */
export function cleanFixText(raw: string, maxLen = FIX_TEXT_MAX): string {
  const parts = parseFix(raw.replace(/\s+/g, " "));
  const kept: FixPart[] = [];
  let marks = 0;
  for (const p of parts) {
    if (p.kind === "text") {
      kept.push(p);
      continue;
    }
    const usable =
      (p.wrong || p.right) &&
      p.wrong !== p.right &&
      p.wrong.length <= FIX_SIDE_MAX &&
      p.right.length <= FIX_SIDE_MAX &&
      marks < FIX_MAX_MARKS;
    if (usable) {
      marks++;
      kept.push(p);
    } else if (p.right) {
      kept.push({ kind: "text", text: p.right });
    }
  }

  const out: FixPart[] = [];
  let used = 0;
  for (const p of kept) {
    const len = serialize([p]).length;
    if (used + len <= maxLen) {
      out.push(p);
      used += len;
      continue;
    }
    if (p.kind === "text" && used < maxLen) out.push({ kind: "text", text: p.text.slice(0, maxLen - used) });
    break;
  }
  return serialize(out).replace(/ {2,}/g, " ").trim();
}

/** Words and corrections split into pieces that may wrap between them (never inside one). */
export function fixTokens(parts: FixPart[]): FixAtom[][] {
  const tokens: FixAtom[][] = [];
  let cur: FixAtom[] | null = null;
  const add = (atom: FixAtom) => {
    if (cur) cur.push(atom);
    else {
      cur = [atom];
      tokens.push(cur);
    }
  };
  let index = 0;
  for (const p of parts) {
    if (p.kind === "fix") {
      add({ type: "unit", wrong: p.wrong, right: p.right, index: index++ });
      continue;
    }
    for (const piece of p.text.split(/(\s+)/)) {
      if (!piece) continue;
      if (/^\s+$/.test(piece)) cur = null; // whitespace ends a token
      else add({ type: "word", text: piece });
    }
  }
  return tokens;
}

/** Where each correction sits in the sentence, 0..1, by characters of the original text. */
export function fixMarkPositions(text: string): number[] {
  const parts = parseFix(text);
  const total = Math.max(1, parts.reduce((n, p) => n + (p.kind === "text" ? p.text.length : p.wrong.length || 1), 0));
  const out: number[] = [];
  let before = 0;
  for (const p of parts) {
    if (p.kind === "text") {
      before += p.text.length;
      continue;
    }
    const len = p.wrong.length || 1;
    out.push((before + len / 2) / total);
    before += len;
  }
  return out;
}

/**
 * Pencil position while a fix item is drawn: first it writes the sentence left to right,
 * then it visits each correction in turn (strike it, then write the right word above it).
 * `frac` maps a position in the text to x/y on a sentence that may wrap over several lines.
 */
export function fixTipAt(opts: {
  x: number;
  y: number;
  w: number;
  lines: number;
  pitch: number;
  positions: number[];
  progress: number;
  writePhase?: number;
}): { x: number; y: number } {
  const { x, y, w, lines, pitch, positions, progress } = opts;
  const WRITE = positions.length ? (opts.writePhase ?? 0.4) : 1;
  const at = (frac: number, lift = 0) => {
    const f = Math.min(0.999, Math.max(0, frac)) * lines;
    const line = Math.floor(f);
    return { x: x + (f - line) * w, y: y + line * pitch + pitch * 0.74 - lift };
  };
  if (progress <= WRITE) return at(progress / WRITE);
  const t = ((progress - WRITE) / (1 - WRITE)) * positions.length;
  const i = Math.min(positions.length - 1, Math.floor(t));
  // First part of each slice: the pencil strikes the wrong word; then it writes above it.
  return at(positions[i], t - i > 0.4 ? pitch * 0.5 : 0);
}
