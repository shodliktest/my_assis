/**
 * Safe evaluator for the formulas the AI writes for graphs (y = f(x)).
 *
 * No eval / new Function: a small tokenizer and recursive-descent parser compile
 * the text into closures. Anything that is not plain maths (identifiers other
 * than x / pi / e / the functions below, property access, calls, `=`) is
 * rejected, so model output can never execute code.
 *
 * Accepts what models and students really write: `2x^2-3x+1`, `x²−20x+90`,
 * `y = (x-10)^2 - 10`, `2sin(x)`, `e^(-x)`, `0,5*x`, `√x`, `π/2`, `log10(x)`.
 * Known limit: scientific notation (`1e3`) reads as 1·e·3 because `e` is Euler's number.
 */

export type CompiledFn = (x: number) => number;

const FUNCS: Record<string, (v: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10, // school convention: log = base 10
  lg: Math.log10,
  lb: Math.log2,
  exp: Math.exp,
  floor: Math.floor,
  ceil: Math.ceil,
};
const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E };
// Longest first so "asin" wins over "sin" and "exp" over "e".
const NAMES = [...Object.keys(FUNCS), ...Object.keys(CONSTS), "x"].sort(
  (a, b) => b.length - a.length,
);

const MAX_LEN = 160;
const MAX_TOKENS = 200;
const MAX_DEPTH = 120; // ~60 nested parentheses (each level costs two)

type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

class ExprError extends Error {}

function normalize(src: string): string {
  return src
    .toLowerCase()
    .trim()
    .replace(/^(?:y|f\s*\(\s*x\s*\))\s*=\s*/, "")
    .replace(/[−–—]/g, "-")
    .replace(/[×·⋅]/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/\*\*/g, "^")
    .replace(/log10/g, "lg")
    .replace(/log2/g, "lb")
    .replace(/(\d),(\d)/g, "$1.$2");
}

function segmentName(run: string): string[] | null {
  const out: string[] = [];
  let i = 0;
  while (i < run.length) {
    const hit = NAMES.find((n) => run.startsWith(n, i));
    if (!hit) return null;
    out.push(hit);
    i += hit.length;
  }
  return out;
}

function tokenize(s: string): Tok[] | null {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t") {
      i++;
    } else if (/[0-9.]/.test(c)) {
      const m = /^(?:\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (!m) return null;
      out.push({ t: "num", v: Number(m[0]) });
      i += m[0].length;
    } else if (/[a-z]/.test(c)) {
      const m = /^[a-z]+/.exec(s.slice(i))!;
      const parts = segmentName(m[0]);
      if (!parts) return null;
      for (const p of parts) out.push({ t: "id", v: p });
      i += m[0].length;
    } else if ("+-*/^()".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
    } else {
      return null;
    }
    if (out.length > MAX_TOKENS) return null;
  }
  return out;
}

/** Real-valued power: x^(1/3) of a negative number is the real cube root. */
function powReal(base: number, exp: number): number {
  if (base < 0 && Number.isFinite(exp) && !Number.isInteger(exp)) {
    const n = Math.round(1 / exp);
    if (n % 2 !== 0 && Math.abs(1 / exp - n) < 1e-9) return -Math.pow(-base, exp);
  }
  return Math.pow(base, exp);
}

type Parsed = { fn: CompiledFn; usesX: boolean };

function parse(tokens: Tok[]): Parsed {
  let pos = 0;
  let depth = 0;
  let usesX = false;

  const peek = () => tokens[pos];
  const isOp = (t: Tok | undefined, v: string) => t?.t === "op" && t.v === v;
  const enter = () => {
    if (++depth > MAX_DEPTH) throw new ExprError("too deep");
  };
  const leave = () => {
    depth--;
  };

  function expr(): CompiledFn {
    enter();
    let left = term();
    for (;;) {
      const t = peek();
      if (isOp(t, "+") || isOp(t, "-")) {
        pos++;
        const l = left;
        const r = term();
        left = (t as { v: string }).v === "+" ? (x) => l(x) + r(x) : (x) => l(x) - r(x);
      } else break;
    }
    leave();
    return left;
  }

  function term(): CompiledFn {
    let left = unary();
    for (;;) {
      const t = peek();
      if (isOp(t, "*") || isOp(t, "/")) {
        pos++;
        const l = left;
        const r = unary();
        left = (t as { v: string }).v === "*" ? (x) => l(x) * r(x) : (x) => l(x) / r(x);
      } else if (t && (t.t === "id" || isOp(t, "("))) {
        // implicit multiplication: 2x, 3(x+1), x(x-1), 2sin(x)
        const l = left;
        const r = power();
        left = (x) => l(x) * r(x);
      } else break;
    }
    return left;
  }

  function unary(): CompiledFn {
    enter();
    try {
      const t = peek();
      if (isOp(t, "-")) {
        pos++;
        const r = unary();
        return (x) => -r(x);
      }
      if (isOp(t, "+")) {
        pos++;
        return unary();
      }
      return power();
    } finally {
      leave();
    }
  }

  function power(): CompiledFn {
    const base = atom();
    if (isOp(peek(), "^")) {
      pos++;
      const exp = unary(); // right-associative, allows x^-2
      return (x) => powReal(base(x), exp(x));
    }
    return base;
  }

  function atom(): CompiledFn {
    const t = peek();
    if (!t) throw new ExprError("unexpected end");
    pos++;
    if (t.t === "num") {
      const v = t.v;
      return () => v;
    }
    if (t.t === "id") {
      const f = FUNCS[t.v];
      if (f) {
        let arg: CompiledFn;
        if (isOp(peek(), "(")) {
          pos++;
          arg = expr();
          if (!isOp(peek(), ")")) throw new ExprError("missing )");
          pos++;
        } else {
          arg = power(); // "sqrt x", "√x"
        }
        return (x) => f(arg(x));
      }
      if (t.v === "x") {
        usesX = true;
        return (x) => x;
      }
      const c = CONSTS[t.v];
      if (c !== undefined) return () => c;
      throw new ExprError("unknown name");
    }
    if (t.v === "(") {
      const inner = expr();
      if (!isOp(peek(), ")")) throw new ExprError("missing )");
      pos++;
      return inner;
    }
    throw new ExprError(`unexpected ${t.v}`);
  }

  const fn = expr();
  if (pos !== tokens.length) throw new ExprError("trailing input");
  return { fn, usesX };
}

function compileFull(src: string): Parsed | null {
  if (typeof src !== "string" || src.length === 0 || src.length > MAX_LEN) return null;
  const tokens = tokenize(normalize(src));
  if (!tokens || tokens.length === 0) return null;
  try {
    return parse(tokens);
  } catch (err) {
    if (err instanceof ExprError) return null;
    if (err instanceof RangeError) return null; // stack depth
    throw err;
  }
}

/** Compile `y = f(x)` text. Null when it is not valid, plain maths. */
export function compileExpr(src: string): CompiledFn | null {
  return compileFull(src)?.fn ?? null;
}

/** Evaluate a constant expression ("2*pi", "-10", "1/3"). Null if invalid or it uses x. */
export function evalConst(src: string): number | null {
  const parsed = compileFull(src);
  if (!parsed || parsed.usesX) return null;
  const v = parsed.fn(0);
  return Number.isFinite(v) ? v : null;
}
