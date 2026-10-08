import assert from "node:assert/strict";
import { test } from "node:test";
import { compileExpr, evalConst } from "./math-expr.ts";

const at = (src: string, x: number) => {
  const f = compileExpr(src);
  assert.ok(f, `should compile: ${src}`);
  return f(x);
};
const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("the user's parabola, written every way a model might write it", () => {
  for (const src of [
    "(x-10)^2-10",
    "y = (x-10)^2 - 10",
    "(x−10)²−10",
    "x^2-20x+90",
    "x²−20x+90",
    "x**2 - 20*x + 90",
    "f(x) = (x - 10)^2 - 10",
  ]) {
    close(at(src, 10), -10);
    close(at(src, 12), -6);
    close(at(src, 0), 90);
  }
});

test("precedence and associativity", () => {
  close(at("-x^2", 3), -9);
  close(at("2^3^2", 0), 512); // right associative
  close(at("2^-1", 0), 0.5);
  close(at("x^-2", 2), 0.25);
  close(at("1-2-3", 0), -4);
  close(at("8/4/2", 0), 1);
  close(at("2+3*4", 0), 14);
  close(at("(2+3)*4", 0), 20);
});

test("implicit multiplication", () => {
  close(at("2x", 5), 10);
  close(at("3(x+1)", 1), 6);
  close(at("x(x-1)", 3), 6);
  close(at("2sin(x)", Math.PI / 2), 2);
  close(at("2x^2-3x+1", 2), 3);
  close(at("xx", 3), 9);
});

test("functions and constants", () => {
  close(at("sin(x)", Math.PI / 2), 1);
  close(at("cos(0)", 0), 1);
  close(at("sqrt(x)", 16), 4);
  close(at("√x", 25), 5);
  close(at("abs(x-2)", -3), 5);
  close(at("ln(e)", 0), 1);
  close(at("log(100)", 0), 2);
  close(at("log10(1000)", 0), 3);
  close(at("log2(8)", 0), 3);
  close(at("exp(0)", 0), 1);
  close(at("e^x", 1), Math.E);
  close(at("e^(-x)", 0), 1);
  close(at("π/2", 0), Math.PI / 2);
  close(at("2^x", 3), 8);
  close(at("cbrt(x)", -27), -3);
});

test("real cube roots of negative numbers", () => {
  close(at("x^(1/3)", -8), -2);
  assert.ok(Number.isNaN(at("x^(1/2)", -4)));
});

test("decimal comma and unicode minus", () => {
  close(at("0,5*x", 4), 2);
  close(at("x−1", 1), 0);
});

test("undefined points come out as non-finite, not as exceptions", () => {
  assert.equal(at("1/x", 0), Infinity);
  assert.ok(Number.isNaN(at("sqrt(x)", -1)));
  assert.ok(Number.isNaN(at("ln(x)", -1)));
});

test("constants only: evalConst", () => {
  close(evalConst("2*pi")!, 2 * Math.PI);
  close(evalConst("-10")!, -10);
  close(evalConst("1/3")!, 1 / 3);
  close(evalConst("π")!, Math.PI);
  assert.equal(evalConst("x+1"), null, "uses x");
  assert.equal(evalConst("1/0"), null, "not finite");
  assert.equal(evalConst("abc"), null);
});

test("anything that is not plain maths is rejected", () => {
  for (const src of [
    "alert(1)",
    "process.exit()",
    "constructor",
    "__proto__",
    "this",
    "x=3",
    "x+",
    "((x)",
    "x)",
    "2 3",
    "",
    "x;y",
    "x^",
    "[1,2]",
    "`x`",
    "x".repeat(200),
    "(".repeat(100) + "x" + ")".repeat(100),
    "eval('1')",
    "Math.sin(x)",
    "x => x",
  ]) {
    assert.equal(compileExpr(src), null, JSON.stringify(src.slice(0, 40)));
  }
  assert.equal(compileExpr(5 as unknown as string), null);
});

test("deep but legal nesting does not blow the stack", () => {
  const src = "(".repeat(30) + "x" + ")".repeat(30);
  close(at(src, 7), 7);
});
