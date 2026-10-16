import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { calloutBox, chipsBox, setTextMeasurer, tableBox, textBox, wrapText } from "./layout-metrics.ts";

afterEach(() => setTextMeasurer(null));

// 10px per character regardless of font size: easy to reason about.
const tenPx = () => setTextMeasurer((t) => t.length * 10);

test("wrapText: greedy word wrap with the active measurer", () => {
  tenPx();
  // "aaaa bbbb cccc" = 4+1+4+1+4 chars; each word 40px, space 10px.
  assert.deepEqual(wrapText("aaaa bbbb cccc", 18, 200), { lines: 1, width: 140 });
  assert.equal(wrapText("aaaa bbbb cccc", 18, 100).lines, 2);
  assert.equal(wrapText("aaaa bbbb cccc", 18, 60).lines, 3);
  assert.equal(wrapText("", 18, 100).lines, 1);
  // one word wider than the box breaks inside the word
  assert.equal(wrapText("abcdefghijklmnopqrst", 18, 100).lines, 2);
});

test("textBox: one line is as wide as its text, many lines use the full width", () => {
  tenPx();
  const one = textBox("hello", "sm", 400);
  assert.ok(one.w < 100 && one.w >= 50);
  const many = textBox("word ".repeat(30).trim(), "sm", 200);
  assert.equal(many.w, 200);
  assert.ok(many.h > one.h * 5);
});

test("callout, chips and table shrink to content and grow with it", () => {
  tenPx();
  assert.ok(calloutBox("ok", 500).w < 120);
  assert.ok(chipsBox(["bir", "ikki"], 500).w < 200);
  const small = tableBox([["a", "b"], ["c", "d"]], 600);
  const big = tableBox([["a".repeat(20), "b"], ["c", "d".repeat(20)]], 600);
  assert.ok(small.w < big.w && big.w <= 600);
  const squeezed = tableBox([["x".repeat(30), "y".repeat(30)], ["z", "w"]], 200);
  assert.equal(squeezed.w, 200);
  assert.ok(squeezed.h > small.h, "narrow tables wrap and get taller");
});

// ---- fix: sentences with red-pen corrections ----------------------------------------------

import { FIX_SCALE, fixBox, fixPitch, fixUnitWidth } from "./layout-metrics.ts";

test("fixUnitWidth: the correction above is smaller, the wider of the two decides", () => {
  tenPx();
  const wrongWider = fixUnitWidth("abcdefgh", "ab", 22);
  assert.equal(wrongWider, 80 + 10);
  const rightWider = fixUnitWidth("ab", "abcdefghijkl", 22);
  assert.equal(rightWider, 120 + 10);
  // an insertion has no struck word: room for the caret only
  assert.equal(fixUnitWidth("", "am", 22), 20 + 10 > 24 ? 20 + 10 : 24);
  assert.ok(FIX_SCALE < 1);
});

test("fixBox: every line has room for the green word above, wrapping adds lines", () => {
  tenPx();
  const one = fixBox("She [[go>>goes]] home", "md", 600);
  assert.equal(one.h, fixPitch(22) + 4);
  assert.ok(one.w < 600);
  const many = fixBox(`${"word ".repeat(40)}[[go>>goes]] home`, "md", 300);
  assert.equal(many.w, 300);
  assert.ok(many.h >= fixPitch(22) * 5, `h=${many.h}`);
  // a sentence with corrections is taller per line than a plain line of the same size
  assert.ok(fixPitch(22) > textBox("x", "md", 600).h);
});

test("fixBox: a word glued to a correction wraps together with it", () => {
  tenPx();
  // "aaaaaaaaaa" (100px) + unit "[[b>>c]]" with 10px + padding 10 = 20 → 120 glued; max 110 forces the break before the pair
  const box = fixBox("aaaaaaaaaa [[b>>c]],", "md", 110);
  assert.equal(box.h, fixPitch(22) * 2 + 4);
});
