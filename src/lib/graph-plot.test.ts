import assert from "node:assert/strict";
import { test } from "node:test";
import { formatTick, layoutGraph, makeTicks, niceStep, prettyExpr } from "./graph-plot.ts";
import type { GraphSpec } from "./lesson.ts";

const W = 616;
const H = 312;
const close = (a: number, b: number, eps = 0.6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

/** Parse the "M x y L x y ..." path back into points. */
function pathPoints(d: string): { x: number; y: number }[] {
  return [...d.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
}

const parabola: GraphSpec = {
  fn: [{ expr: "(x-10)^2-10" }],
  points: [{ x: 10, y: -10, label: "cho'qqi" }],
  xmin: 0,
  xmax: 20,
  vlines: [10],
};

test("ticks: 1-2-5 steps and clean labels", () => {
  assert.equal(niceStep(20, 5), 5);
  assert.equal(niceStep(100, 5), 20);
  assert.equal(niceStep(1, 5), 0.2);
  assert.deepEqual(makeTicks(0, 20, 5).map((t) => t.v), [0, 5, 10, 15, 20]);
  assert.deepEqual(makeTicks(-1, 1, 4).map((t) => t.v), [-1, -0.5, 0, 0.5, 1]);
  assert.equal(formatTick(0.30000000000000004, 0.1), "0.3");
  assert.equal(formatTick(-0, 1), "0");
  assert.equal(formatTick(1500, 500), "1500");
});

test("parabola: the vertex marker sits ON the drawn curve at the lowest point", () => {
  const g = layoutGraph(parabola, W, H);
  assert.equal(g.curves.length, 1);
  const pts = pathPoints(g.curves[0].d);
  assert.ok(pts.length > 200);
  const vertex = g.points[0];
  // The curve is flat near its minimum, so take every point within a quarter pixel
  // of the lowest one: the vertex marker must sit inside that bottom stretch.
  const maxY = Math.max(...pts.map((p) => p.y));
  const bottom = pts.filter((p) => p.y >= maxY - 0.25);
  assert.ok(vertex.px >= Math.min(...bottom.map((p) => p.x)) - 0.6);
  assert.ok(vertex.px <= Math.max(...bottom.map((p) => p.x)) + 0.6);
  close(maxY, vertex.py, 0.6);
  // The dashed axis of symmetry passes through the same column.
  close(g.vlines[0].px, vertex.px, 0.2);
  assert.equal(g.vlines[0].label, "x = 10");
});

test("parabola: ranges include the vertex and the whole curve with padding", () => {
  const g = layoutGraph(parabola, W, H);
  assert.deepEqual(g.xr, [0, 20]);
  assert.ok(g.yr[0] < -10 && g.yr[1] > 90, JSON.stringify(g.yr));
  assert.equal(g.xAxisPx !== null, true, "x-axis (y=0) is inside the view");
  assert.equal(g.yAxisPx !== null, true, "y-axis (x=0) is at the left edge");
});

test("a curve never leaves the plot area by more than the clip allows, and stays finite", () => {
  for (const expr of ["x^2", "x^5", "1/x", "tan(x)", "sqrt(x)", "ln(x)", "e^x", "abs(x)", "sin(x)/x"]) {
    const g = layoutGraph({ fn: [{ expr }], points: [], xmin: -6, xmax: 6 }, W, H);
    for (const p of pathPoints(g.curves[0].d)) {
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), expr);
      assert.ok(Math.abs(p.y) <= 1e5 + 1, expr);
    }
  }
});

test("asymptotes: tan(x) and 1/x are broken into pieces instead of one vertical streak", () => {
  for (const expr of ["tan(x)", "1/x"]) {
    const g = layoutGraph({ fn: [{ expr }], points: [], xmin: -6, xmax: 6, ymin: -6, ymax: 6 }, W, H);
    const d = g.curves[0].d;
    assert.ok((d.match(/M/g) ?? []).length >= 2, `${expr} should have several pieces`);
    // No consecutive pair of path points leaps from above the plot to below it.
    const pts = pathPoints(d);
    const { y0, y1 } = g.plot;
    const subpaths = d.split("M").filter(Boolean).map((s) => pathPoints("M" + s));
    for (const sp of subpaths) {
      for (let i = 1; i < sp.length; i++) {
        const a = sp[i - 1].y;
        const b = sp[i].y;
        assert.ok(!((a < y0 && b > y1) || (a > y1 && b < y0)), `${expr}: streak ${a} → ${b}`);
      }
    }
    assert.ok(pts.length > 20);
  }
});

test("auto y-range ignores asymptote spikes", () => {
  const g = layoutGraph({ fn: [{ expr: "tan(x)" }], points: [], xmin: -6, xmax: 6 }, W, H);
  assert.ok(g.yr[1] - g.yr[0] < 200, `range ${JSON.stringify(g.yr)} should not be dominated by spikes`);
});

test("equal aspect: a circle is round (same pixels per unit on both axes)", () => {
  const spec: GraphSpec = {
    fn: [{ expr: "sqrt(25-x^2)" }, { expr: "-sqrt(25-x^2)" }],
    points: [{ x: 0, y: 0, label: "markaz" }],
    xmin: -7,
    xmax: 7,
    equal: true,
  };
  const g = layoutGraph(spec, W, H);
  const sx = g.plot.w / (g.xr[1] - g.xr[0]);
  const sy = g.plot.h / (g.yr[1] - g.yr[0]);
  close(sx, sy, 1e-6);
  // Rightmost point of the circle is 5 units from the centre, on the x-axis row.
  const pts = pathPoints(g.curves[0].d);
  const right = pts.reduce((a, b) => (b.x > a.x ? b : a));
  close(right.x - g.points[0].px, 5 * sx, 1.5);
});

test("line chart from data: points are joined in x order", () => {
  const g = layoutGraph(
    { fn: [], points: [{ x: 3, y: 11 }, { x: 1, y: 12 }, { x: 2, y: 15 }], connect: true },
    W,
    H,
  );
  assert.equal(g.curves.length, 0);
  const pts = pathPoints(g.line!);
  assert.equal(pts.length, 3);
  assert.ok(pts[0].x < pts[1].x && pts[1].x < pts[2].x);
  assert.equal(g.points.length, 3);
  assert.ok(g.yr[0] < 11 && g.yr[1] > 15);
});

test("explicit ranges win; points outside them are not drawn", () => {
  const g = layoutGraph({ fn: [{ expr: "x" }], points: [{ x: 0, y: 0 }, { x: 50, y: 50 }], xmin: -5, xmax: 5, ymin: -5, ymax: 5 }, W, H);
  assert.deepEqual(g.xr, [-5, 5]);
  assert.deepEqual(g.yr, [-5, 5]);
  assert.equal(g.points.length, 1);
});

test("labels near the right/top edge flip so they stay readable", () => {
  const g = layoutGraph({ fn: [], points: [{ x: 9.8, y: 9.8, label: "chetda" }, { x: -9, y: -9, label: "pastda" }], xmin: -10, xmax: 10, ymin: -10, ymax: 10 }, W, H);
  const [right, left] = g.points;
  assert.equal(right.anchor, "end");
  assert.ok(right.dy > 0, "label drops below a point at the very top");
  assert.equal(left.anchor, "start");
  assert.ok(left.dy < 0);
});

test("no data at all still yields a usable frame", () => {
  const g = layoutGraph({ fn: [], points: [] }, W, H);
  assert.deepEqual(g.xr, [-10, 10]);
  assert.ok(g.xTicks.length >= 3 && g.yTicks.length >= 3);
});

test("default curve labels are readable", () => {
  assert.equal(prettyExpr("x^2-20*x+90"), "x²-20·x+90");
  assert.equal(prettyExpr("y = sin(pi*x)"), "sin(π·x)");
  const g = layoutGraph({ fn: [{ expr: "x^2" }], points: [], xmin: -2, xmax: 2 }, W, H);
  assert.equal(g.curves[0].label, "y = x²");
});

test("a circle written as two half-curves is closed: the arcs meet at the sides", () => {
  const g = layoutGraph(
    { fn: [{ expr: "1+sqrt(9-(x-2)^2)" }, { expr: "1-sqrt(9-(x-2)^2)" }], points: [], xmin: -2, xmax: 6, equal: true },
    W,
    H,
  );
  const upper = pathPoints(g.curves[0].d);
  const lower = pathPoints(g.curves[1].d);
  const rightU = upper.reduce((a, b) => (b.x > a.x ? b : a));
  const rightL = lower.reduce((a, b) => (b.x > a.x ? b : a));
  const leftU = upper.reduce((a, b) => (b.x < a.x ? b : a));
  const leftL = lower.reduce((a, b) => (b.x < a.x ? b : a));
  assert.ok(Math.abs(rightU.y - rightL.y) < 1.5, `right gap ${Math.abs(rightU.y - rightL.y)}px`);
  assert.ok(Math.abs(leftU.y - leftL.y) < 1.5, `left gap ${Math.abs(leftU.y - leftL.y)}px`);
  close(rightU.x, rightL.x, 0.3);
});

test("sqrt(x) starts exactly at x = 0", () => {
  const g = layoutGraph({ fn: [{ expr: "sqrt(x)" }], points: [], xmin: -4, xmax: 9 }, W, H);
  const pts = pathPoints(g.curves[0].d);
  const first = pts[0];
  const zeroPx = g.yAxisPx!;
  close(first.x, zeroPx, 0.3);
});

test("data-only line chart frames the data tightly (no empty half-page)", () => {
  const g = layoutGraph(
    { fn: [], points: [1, 2, 3, 4, 5].map((x) => ({ x, y: x * 2 })), connect: true },
    W,
    H,
  );
  assert.ok(g.xr[0] > 0 && g.xr[0] < 1, JSON.stringify(g.xr));
  assert.ok(g.xr[1] > 5 && g.xr[1] < 6);
  assert.equal(g.yAxisPx, null, "x = 0 is off-screen, so no y-axis line");
});
