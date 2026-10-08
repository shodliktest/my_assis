import assert from "node:assert/strict";
import { test } from "node:test";
import { extractJson, sanitizeLessonPayload } from "./explain-sanitize.ts";

const good = {
  title: "Present Simple",
  beats: [
    {
      speech: "Present Simple odatiy ishlarni bildiradi.",
      caption: "Odatiy ishlar",
      items: [
        { kind: "title", text: "Present Simple", x: 5, y: 4, w: 90, color: "#1d4ed8", size: "xl" },
        { kind: "box", x: 5, y: 12, w: 90, h: 18, color: "#1d4ed8" },
        { kind: "text", text: "I read books.", x: 8, y: 14, w: 84 },
      ],
    },
  ],
};

test("a well-formed lesson passes through", () => {
  const lesson = sanitizeLessonPayload(good);
  assert.ok(lesson);
  assert.equal(lesson.title, "Present Simple");
  assert.equal(lesson.beats.length, 1);
  assert.equal(lesson.beats[0].items.length, 3);
  assert.equal(lesson.beats[0].caption, "Odatiy ishlar");
});

test("over-long text is truncated, not rejected", () => {
  const lesson = sanitizeLessonPayload({
    title: "T".repeat(500),
    beats: [
      {
        speech: "S".repeat(5000),
        caption: "C".repeat(5000),
        items: [{ kind: "text", text: "x".repeat(1000), x: 1, y: 1 }],
      },
    ],
  });
  assert.ok(lesson);
  assert.equal(lesson.title.length, 100);
  assert.equal(lesson.beats[0].speech.length, 900);
  assert.equal(lesson.beats[0].items[0].text?.length, 220);
});

test("string numbers, missing coordinates and unknown kinds are repaired", () => {
  const lesson = sanitizeLessonPayload({
    title: "x",
    beats: [
      {
        speech: "gap",
        items: [
          { kind: "sparkle", text: "a", x: "12%", y: "30" },
          { kind: "box", text: "b" },
        ],
      },
    ],
  });
  assert.ok(lesson);
  const [a, b] = lesson.beats[0].items;
  assert.equal(a.kind, "text", "unknown kind falls back to text");
  assert.equal(a.x, 12);
  assert.equal(a.y, 30);
  assert.equal(typeof b.x, "number");
  assert.equal(typeof b.y, "number");
});

test("invalid items/beats are dropped, valid siblings survive", () => {
  const lesson = sanitizeLessonPayload({
    title: "x",
    beats: [
      null,
      "nope",
      { speech: "", items: [{ kind: "text", text: "a", x: 1, y: 1 }] },
      { speech: "bo'sh beat", items: [] },
      { speech: "yaxshi", items: [42, null, { kind: "text", text: "ok", x: 1, y: 1 }] },
    ],
  });
  assert.ok(lesson);
  assert.equal(lesson.beats.length, 1);
  assert.equal(lesson.beats[0].speech, "yaxshi");
  assert.equal(lesson.beats[0].items.length, 1);
});

test("caption stands in for a missing speech and vice versa", () => {
  const lesson = sanitizeLessonPayload({
    beats: [{ caption: "faqat sarlavha", items: [{ kind: "text", text: "a", x: 1, y: 1 }] }],
  });
  assert.ok(lesson);
  assert.equal(lesson.title, "Dars");
  assert.equal(lesson.beats[0].speech, "faqat sarlavha");
});

test("table rows and chips are clamped", () => {
  const lesson = sanitizeLessonPayload({
    title: "t",
    beats: [
      {
        speech: "jadval",
        items: [
          {
            kind: "table",
            x: 5,
            y: 5,
            rows: [["a", 1, null, "d", "e", "overflow"], "bad", ["x"]],
            chips: ["one", 2, "", null, "x".repeat(100)],
          },
        ],
      },
    ],
  });
  assert.ok(lesson);
  const item = lesson.beats[0].items[0];
  assert.deepEqual(item.rows?.[0], ["a", "1", "", "d", "e"]);
  assert.equal(item.rows?.length, 2, "non-array rows are dropped");
  assert.deepEqual(item.chips?.slice(0, 2), ["one", "2"]);
  assert.equal(item.chips?.[2].length, 32);
});

test("garbage payloads give null instead of throwing", () => {
  for (const bad of [null, undefined, 5, "text", [], {}, { beats: [] }, { beats: "x" }]) {
    assert.equal(sanitizeLessonPayload(bad), null);
  }
});

test("extractJson handles fences, think blocks and surrounding chatter", () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(extractJson('<think>hmm {"x":0}</think>\n{"a":2}'), { a: 2 });
  assert.deepEqual(extractJson('Mana javob: {"a":3} rahmat'), { a: 3 });
  assert.throws(() => extractJson("hech narsa yo'q"), /JSON topilmadi/);
  assert.throws(() => extractJson('{"a": '));
});

import { sanitizeGraph } from "./explain-sanitize.ts";

test("graph: the user's parabola survives intact", () => {
  const lesson = sanitizeLessonPayload({
    title: "Parabola",
    beats: [
      {
        speech: "Parabola cho'qqisi o'ntada.",
        items: [
          { kind: "box" },
          {
            kind: "graph",
            graph: {
              fn: [{ expr: "(x-10)^2-10", label: "y = (x−10)² − 10" }],
              points: [{ x: 10, y: -10, label: "cho'qqi (10; −10)" }],
              xmin: 0,
              xmax: 20,
              vlines: [10],
            },
          },
        ],
      },
    ],
  });
  assert.ok(lesson);
  const g = lesson.beats[0].items.find((i) => i.kind === "graph")?.graph;
  assert.ok(g);
  assert.equal(g.fn[0].expr, "(x-10)^2-10");
  assert.deepEqual(g.points[0], { x: 10, y: -10, label: "cho'qqi (10; −10)" });
  assert.equal(g.xmin, 0);
  assert.equal(g.xmax, 20);
  assert.deepEqual(g.vlines, [10]);
});

test("graph: bad formulas are dropped, good ones kept, nothing executes", () => {
  const g = sanitizeGraph({
    fn: ["x^2", "alert(1)", { expr: "process.exit()" }, { expr: "sqrt(x-100)" }, "2x+1"],
    xmin: -5,
    xmax: 5,
  });
  assert.ok(g);
  // sqrt(x-100) is undefined everywhere on [-5, 5]: not plottable there.
  assert.deepEqual(g.fn.map((f) => f.expr), ["x^2", "2x+1"]);
});

test("graph: constant expressions are accepted for ranges and points", () => {
  const g = sanitizeGraph({
    fn: "sin(x)",
    xmin: "-2*pi",
    xmax: "2*pi",
    points: [{ x: "pi/2", y: 1 }, [0, 0], { x: "abc", y: 1 }, { x: 1 }],
  });
  assert.ok(g);
  assert.ok(Math.abs(g.xmin! + 2 * Math.PI) < 1e-9);
  assert.equal(g.points.length, 2);
  assert.ok(Math.abs(g.points[0].x - Math.PI / 2) < 1e-9);
});

test("graph: inverted or half-given ranges are ignored, flags need true", () => {
  const g = sanitizeGraph({ fn: "x", xmin: 5, xmax: -5, ymin: 1, connect: "true", equal: "yes" });
  assert.ok(g);
  assert.equal(g.xmin, undefined);
  assert.equal(g.ymin, undefined);
  assert.equal(g.connect, true);
  assert.equal(g.equal, undefined);
});

test("graph: data-only (line chart) works; empty or garbage graphs become null", () => {
  const g = sanitizeGraph({ points: [[1, 12], [2, 15], [3, 11]], connect: true, xlabel: "kun", ylabel: "°C" });
  assert.ok(g);
  assert.equal(g.fn.length, 0);
  assert.equal(g.points.length, 3);
  for (const bad of [null, "x", {}, { fn: [] }, { fn: ["???"] }, { points: [{ x: "a", y: "b" }] }]) {
    assert.equal(sanitizeGraph(bad), null);
  }
});

test("graph: an item with an unusable graph is dropped, siblings survive", () => {
  const lesson = sanitizeLessonPayload({
    title: "t",
    beats: [
      {
        speech: "s",
        items: [
          { kind: "graph", graph: { fn: ["alert(1)"] } },
          { kind: "text", text: "qoladi", x: 1, y: 1 },
        ],
      },
    ],
  });
  assert.ok(lesson);
  assert.deepEqual(lesson.beats[0].items.map((i) => i.kind), ["text"]);
});

test("graph: flat fields on the item (no nested graph object) are tolerated", () => {
  const lesson = sanitizeLessonPayload({
    title: "t",
    beats: [{ speech: "s", items: [{ kind: "graph", fn: ["x^2"], xmin: -3, xmax: 3 }] }],
  });
  assert.ok(lesson);
  assert.equal(lesson.beats[0].items[0].graph?.fn[0].expr, "x^2");
});

test("graph: the limits are enforced", () => {
  const g = sanitizeGraph({
    fn: Array.from({ length: 6 }, (_, i) => `x+${i}`),
    points: Array.from({ length: 30 }, (_, i) => [i, i]),
    vlines: [1, 2, 3, 4, 5, 6],
    xlabel: "x".repeat(100),
  });
  assert.ok(g);
  assert.equal(g.fn.length, 3);
  assert.equal(g.points.length, 12);
  assert.equal(g.vlines?.length, 4);
  assert.equal(g.xlabel?.length, 24);
});

test("code: indentation and newlines survive, limits apply", () => {
  const lesson = sanitizeLessonPayload({
    title: "t",
    beats: [
      {
        speech: "s",
        items: [
          { kind: "code", text: "\n\nfor i in range(3):\n    print(i)\n\t# izoh\n\n" },
          { kind: "code", text: Array.from({ length: 30 }, (_, i) => `line ${i} ${"x".repeat(80)}`).join("\n") },
        ],
      },
    ],
  });
  assert.ok(lesson);
  const [a, b] = lesson.beats[0].items;
  assert.equal(a.text, "for i in range(3):\n    print(i)\n    # izoh");
  assert.equal(b.text!.split("\n").length, 14);
  assert.ok(b.text!.split("\n").every((l) => l.length <= 58));
  assert.ok(b.text!.length <= 850);
});

test("code: double-escaped newlines are repaired; empty code is dropped", () => {
  const lesson = sanitizeLessonPayload({
    title: "t",
    beats: [
      {
        speech: "s",
        items: [
          { kind: "code", text: "a = 1\\nb = 2" },
          { kind: "code", text: "   \n  " },
          { kind: "code" },
          { kind: "text", text: "qoladi", x: 1, y: 1 },
        ],
      },
    ],
  });
  assert.ok(lesson);
  assert.equal(lesson.beats[0].items[0].text, "a = 1\nb = 2");
  assert.deepEqual(lesson.beats[0].items.map((i) => i.kind), ["code", "text"]);
});

test("table: a 9-row truth table is kept; 11+ rows are cut", () => {
  const rows = (n: number) => Array.from({ length: n }, (_, i) => [`A${i}`, "B", "C"]);
  const mk = (n: number) =>
    sanitizeLessonPayload({ title: "t", beats: [{ speech: "s", items: [{ kind: "table", x: 1, y: 1, rows: rows(n) }] }] })!
      .beats[0].items[0].rows!.length;
  assert.equal(mk(9), 9);
  assert.equal(mk(15), 10);
});

test("timeline, icons and bars without data are dropped; side survives only on boxes", () => {
  const lesson = sanitizeLessonPayload({
    title: "t",
    beats: [
      {
        speech: "s",
        items: [
          { kind: "box", side: "left" },
          { kind: "box", side: "sideways" },
          { kind: "text", text: "bor", side: "left", x: 1, y: 1 },
          { kind: "timeline" },
          { kind: "icons", rows: [] },
          { kind: "bars", rows: [["", ""]] },
          { kind: "timeline", rows: [["1336", "Tug'ildi", "Kesh"], ["1405", "Vafot"]] },
        ],
      },
    ],
  })!;
  const items = lesson.beats[0].items;
  assert.deepEqual(items.map((i) => i.kind), ["box", "box", "text", "timeline"]);
  assert.equal(items[0].side, "left");
  assert.equal(items[1].side, undefined);
  assert.equal(items[2].side, undefined);
  assert.deepEqual(items[3].rows, [["1336", "Tug'ildi", "Kesh"], ["1405", "Vafot"]]);
});

test("duplicate ids from the model become unique", () => {
  const lesson = sanitizeLessonPayload({
    title: "t",
    beats: [
      { id: "same", speech: "a", items: [{ id: "x", kind: "text", text: "1", x: 1, y: 1 }, { id: "x", kind: "text", text: "2", x: 1, y: 1 }] },
      { id: "same", speech: "b", items: [{ id: "x", kind: "text", text: "3", x: 1, y: 1 }] },
    ],
  })!;
  const ids = lesson.beats.flatMap((b) => [b.id, ...b.items.map((i) => i.id)]);
  assert.equal(new Set(ids).size, ids.length);
});
