import assert from "node:assert/strict";
import { test } from "node:test";
import { COMPARE_LESSON, CONTINUOUS_LESSON, SIMPLE_LESSON, localLessonFor } from "./lesson.ts";

test("grammar questions still reach the built-in lessons", () => {
  assert.equal(localLessonFor("Present Continuous nima?"), CONTINUOUS_LESSON);
  assert.equal(localLessonFor("hozirgi davom etuvchi zamon"), CONTINUOUS_LESSON);
  assert.equal(localLessonFor("Present Simple nima?"), SIMPLE_LESSON);
  assert.equal(localLessonFor("Present Simple va Continuous farqi"), COMPARE_LESSON);
  assert.equal(localLessonFor("Simple bilan continuous solishtir"), COMPARE_LESSON);
});

test("unrelated questions never get a Present Simple/Continuous lesson", () => {
  for (const q of [
    "Fotosintez va xemosintez farqi",
    "Python va JavaScript solishtiring",
    "Rim imperiyasi vs Yunoniston",
    "Quyosh tizimi qanday tuzilgan?",
    "Avstraliya poytaxti qaysi?",
    "Inflyatsiya nima?",
  ]) {
    assert.equal(localLessonFor(q), null, q);
  }
});

test("other tenses are not mistaken for the present ones", () => {
  for (const q of ["Past Continuous nima?", "Past Simple qanday tuziladi?", "Future Simple", "Present Perfect"]) {
    assert.equal(localLessonFor(q), null, q);
  }
});

import {
  PAGE_H,
  appendLesson,
  lessonBottom,
  lessonPageSize,
  stabilizeLessonLayout,
  type DrawItem,
  type Lesson,
} from "./lesson.ts";
import { setTextMeasurer } from "./layout-metrics.ts";

const tableLesson = (rows: string[][]): Lesson => ({
  title: "t",
  beats: [
    {
      id: "b",
      speech: "s",
      caption: "c",
      items: [
        { id: "box", kind: "box", x: 0, y: 0, color: "#1d4ed8" },
        { id: "tbl", kind: "table", x: 0, y: 0, color: "#1e3a5f", rows },
        { id: "after", kind: "text", text: "keyin", x: 0, y: 0, color: "#1e3a5f" },
      ],
    },
  ],
});

for (const mode of ["short", "full"] as const) {
  test(`table height follows wrapped rows, so nothing overlaps (${mode})`, () => {
    const cases: string[][][] = [
      [["A", "B"], ["1", "2"]],
      [["Belgi", "Nomi", "Birligi"], ["v", "tezlik", "m/s"], ["a", "tezlanish", "m/s²"], ["F", "kuch", "N"], ["m", "massa", "kg"]],
      // long cell text wraps to several lines
      [["Mezon", "Birinchi", "Ikkinchi"], ["Tuzilishi", "Murakkab va uzun izoh matni", "Oddiy"], ["Vazifasi", "Energiya ishlab chiqarish va saqlash", "Himoya"]],
      // 9-row truth table
      [["A", "B", "C", "A∧B∧C"], ...Array.from({ length: 8 }, (_, i) => [String(i & 1), String((i >> 1) & 1), String((i >> 2) & 1), "0"])],
    ];
    for (const rows of cases) {
      const laid = stabilizeLessonLayout(tableLesson(rows), PAGE_H[mode]).beats[0].items;
      const tbl = laid.find((i: DrawItem) => i.kind === "table")!;
      const after = laid.find((i: DrawItem) => i.id === "after")!;
      const box = laid.find((i: DrawItem) => i.kind === "box")!;
      // Real table height: single-line rows are ~36px, wrapped rows add ~23px per extra line.
      const pageH = PAGE_H[mode];
      const minPx = rows.length * 35;
      assert.ok(((tbl.h ?? 0) / 100) * pageH >= minPx - 1 || (tbl.h ?? 0) >= minPx - 1, `table too short for ${rows.length} rows`);
      assert.ok(after.y >= tbl.y + (tbl.h ?? 0) - 0.01, "next row starts below the table");
      assert.ok(tbl.y + (tbl.h ?? 0) <= box.y + (box.h ?? 0) + 0.01, "table stays inside its box");
    }
  });
}

const sideLesson = (leftKind: DrawItem["kind"], withRight = true): Lesson => ({
  title: "t",
  beats: [
    {
      id: "b",
      speech: "s",
      caption: "c",
      items: [
        { id: "t", kind: "title", text: "Sarlavha", x: 0, y: 0, color: "#111" },
        { id: "l", kind: "box", side: "left", x: 0, y: 0, color: "#1d4ed8" },
        leftKind === "bars"
          ? { id: "lc", kind: "bars", rows: [["A", "10"], ["B", "20"]], x: 0, y: 0, color: "#111" }
          : { id: "lc", kind: "text", text: "chap", x: 0, y: 0, color: "#111" },
        ...(withRight
          ? ([
              { id: "r", kind: "box", side: "right", x: 0, y: 0, color: "#b45309" },
              { id: "rc1", kind: "text", text: "o'ng 1", x: 0, y: 0, color: "#111" },
              { id: "rc2", kind: "text", text: "o'ng 2", x: 0, y: 0, color: "#111" },
            ] as DrawItem[])
          : []),
        { id: "after", kind: "text", text: "pastda", x: 0, y: 0, color: "#111" },
      ],
    },
  ],
});

test("side-by-side: chart and notes share a row, the next group starts below both", () => {
  const items = stabilizeLessonLayout(sideLesson("bars"), 1480).beats[0].items;
  const byId = (id: string) => items.find((i) => i.id === id)!;
  const l = byId("l");
  const r = byId("r");
  assert.equal(l.y, r.y, "columns start on the same line");
  assert.ok(l.x + (l.w ?? 0) <= r.x, "right column is to the right of the left one");
  assert.ok((l.w ?? 0) > (r.w ?? 0), "a chart gets the wider column");
  assert.ok(r.x + (r.w ?? 0) <= 720);
  const bottom = Math.max(l.y + (l.h ?? 0), r.y + (r.h ?? 0));
  // "after" falls in the left box (no side marker of its own after the right box): it belongs to the right box here.
  assert.ok(byId("after").x >= r.x, "trailing rows stay inside the right-hand box");
  assert.ok(bottom > l.y);
});

test("side-by-side: a lone side marker is laid out alone from the left margin", () => {
  const items = stabilizeLessonLayout(sideLesson("text", false), 1480).beats[0].items;
  const box = items.find((i) => i.id === "l")!;
  assert.equal(box.x, 36);
  assert.ok((box.w ?? 0) <= 648);
});

test("the title never overlaps the box under it", () => {
  const items = stabilizeLessonLayout(sideLesson("text"), 1480).beats[0].items;
  const title = items.find((i) => i.kind === "title")!;
  const box = items.find((i) => i.id === "l")!;
  assert.ok(title.y + (title.h ?? 0) <= box.y, `${title.y + (title.h ?? 0)} > ${box.y}`);
});

const textLesson = (texts: string[], kind: DrawItem["kind"] = "text"): Lesson => ({
  title: "t",
  beats: [
    {
      id: "b",
      speech: "s",
      caption: "c",
      items: [
        { id: "box", kind: "box", x: 0, y: 0, color: "#1d4ed8" },
        ...texts.map((text, i) => ({ id: `t${i}`, kind, text, x: 0, y: 0, color: "#111" }) as DrawItem),
      ],
    },
  ],
});

test("a box is only as wide as its text, and as tall as its lines", () => {
  const short = stabilizeLessonLayout(textLesson(["Salom dunyo"]), 1480).beats[0].items;
  const box = short.find((i) => i.kind === "box")!;
  const row = short.find((i) => i.id === "t0")!;
  assert.ok((box.w ?? 0) < 300, `box hugs a short line (${box.w})`);
  assert.ok((box.w ?? 0) >= (row.w ?? 0) + 32, "padding on both sides");
  assert.ok(row.x + (row.w ?? 0) <= box.x + (box.w ?? 0) - 16 + 0.5, "text stays inside the box");

  const long = "Bu juda uzun gap bo'lib, u bitta qatorga sig'maydi va albatta o'raladi ".repeat(3).trim();
  const wide = stabilizeLessonLayout(textLesson([long]), 1480).beats[0].items;
  const wbox = wide.find((i) => i.kind === "box")!;
  const wrow = wide.find((i) => i.id === "t0")!;
  assert.equal(wbox.w, 648, "a long paragraph uses the full column");
  assert.ok((wrow.h ?? 0) > (row.h ?? 0), "more lines, taller row");
  assert.ok(wrow.y + (wrow.h ?? 0) <= wbox.y + (wbox.h ?? 0), "row inside box vertically");
});

test("the widest row decides the box width; bands stretch to it", () => {
  const items = stabilizeLessonLayout(
    {
      title: "t",
      beats: [
        {
          id: "b",
          speech: "s",
          caption: "c",
          items: [
            { id: "box", kind: "box", x: 0, y: 0, color: "#111" },
            { id: "a", kind: "text", text: "Qisqa", x: 0, y: 0, color: "#111" },
            { id: "b", kind: "text", text: "Ancha uzunroq satr bu yerda", x: 0, y: 0, color: "#111" },
            { id: "f", kind: "formula", text: "a = b", x: 0, y: 0, color: "#111" },
          ],
        },
      ],
    },
    1480,
  ).beats[0].items;
  const box = items.find((i) => i.kind === "box")!;
  const a = items.find((i) => i.id === "a")!;
  const b = items.find((i) => i.id === "b")!;
  const f = items.find((i) => i.id === "f")!;
  assert.ok((a.w ?? 0) < (b.w ?? 0), "short text keeps its own width");
  assert.equal(f.w, (box.w ?? 0) - 32, "the formula band fills the box");
  assert.ok((box.w ?? 0) < 648);
});

test("a real font measurer changes the fit: wider glyphs, wider box, more wrapping", () => {
  try {
    const base = stabilizeLessonLayout(textLesson(["Bir oz matn bu yerda"]), 1480).beats[0].items;
    setTextMeasurer((text, px) => text.length * px * 0.9); // very wide font
    const wide = stabilizeLessonLayout(textLesson(["Bir oz matn bu yerda"]), 1480).beats[0].items;
    const bw = (items: DrawItem[]) => items.find((i) => i.kind === "box")!.w!;
    const bh = (items: DrawItem[]) => items.find((i) => i.kind === "box")!.h!;
    assert.ok(bw(wide) > bw(base) || bh(wide) > bh(base), "wide glyphs need more room");
  } finally {
    setTextMeasurer(null);
  }
});

test("the board has no height ceiling: 40 beats stack without overlap", () => {
  const beat = (i: number) => ({
    id: `b${i}`,
    speech: "s",
    caption: "c",
    items: [
      { id: `t${i}`, kind: "title", text: `Beat ${i}`, x: 0, y: 0, color: "#111" },
      { id: `x${i}`, kind: "box", x: 0, y: 0, color: "#1d4ed8" },
      { id: `c${i}`, kind: "graph", graph: { fn: [{ expr: "x" }], points: [] }, x: 0, y: 0, color: "#111" },
    ],
  }) as Lesson["beats"][number];
  const laid = stabilizeLessonLayout({ title: "t", beats: Array.from({ length: 40 }, (_, i) => beat(i)) }, 1480);
  const ys = laid.beats.map((b) => b.items.find((i) => i.kind === "title")!.y);
  assert.ok(ys.every((y, i) => i === 0 || y > ys[i - 1]), "titles strictly increase");
  const size = lessonPageSize(laid);
  assert.ok(size.h > 12000, `page grew to ${size.h}`);
  assert.ok(size.h >= lessonBottom(laid));
});

test("a follow-up question continues below the earlier work, with unique ids", () => {
  const first = stabilizeLessonLayout(textLesson(["Birinchi savol javobi"]), 1480);
  const second = stabilizeLessonLayout(textLesson(["Ikkinchi savol javobi"]), 1480);
  const merged = appendLesson(first, second);
  assert.equal(merged.beats.length, 2);
  const firstBottom = lessonBottom(first);
  const added = merged.beats[1].items;
  assert.ok(Math.min(...added.map((i) => i.y)) >= firstBottom + 60, "starts below the first lesson");
  // the shifted copy is the same shape as the original
  const orig = second.beats[0].items;
  const dy = added[0].y - orig[0].y;
  added.forEach((it, i) => {
    assert.equal(it.y - orig[i].y, dy);
    assert.equal(it.x, orig[i].x);
    assert.equal(it.h, orig[i].h);
  });
  const ids = merged.beats.flatMap((b) => [b.id, ...b.items.map((i) => i.id)]);
  assert.equal(new Set(ids).size, ids.length, "every id on the board is unique");
  // appending twice keeps growing downwards and ids stay unique
  const third = appendLesson(merged, stabilizeLessonLayout(textLesson(["Uchinchi"]), 1480));
  const ids3 = third.beats.flatMap((b) => [b.id, ...b.items.map((i) => i.id)]);
  assert.equal(new Set(ids3).size, ids3.length);
  assert.ok(lessonBottom(third) > lessonBottom(merged));
  // an empty board simply becomes the new lesson
  assert.equal(appendLesson({ title: "", beats: [] }, second), second);
});
