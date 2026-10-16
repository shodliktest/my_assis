import assert from "node:assert/strict";
import test from "node:test";
import {
  FIX_MAX_MARKS,
  FIX_SIDE_MAX,
  cleanFixText,
  fixCount,
  fixMarkPositions,
  fixPlain,
  fixTipAt,
  fixTokens,
  parseFix,
} from "./fix-markup.ts";

test("parseFix splits plain runs and corrections", () => {
  assert.deepEqual(parseFix("She [[go>>goes]] to school."), [
    { kind: "text", text: "She " },
    { kind: "fix", wrong: "go", right: "goes" },
    { kind: "text", text: " to school." },
  ]);
});

test("a correction may be an insertion or a deletion", () => {
  assert.deepEqual(parseFix("I [[>>am]] happy"), [
    { kind: "text", text: "I " },
    { kind: "fix", wrong: "", right: "am" },
    { kind: "text", text: " happy" },
  ]);
  assert.deepEqual(parseFix("He [[is>>]] plays")[1], { kind: "fix", wrong: "is", right: "" });
});

test("other arrows are accepted, whitespace around the pieces is trimmed", () => {
  for (const sep of ["->", "=>", "→", ">>"]) {
    const p = parseFix(`a [[ was ${sep} were ]] b`)[1];
    assert.deepEqual(p, { kind: "fix", wrong: "was", right: "were" }, sep);
  }
});

test("stray brackets never survive", () => {
  const text = parseFix("Broken [[mark and ]] more [[").map((p) => (p.kind === "text" ? p.text : "")).join("");
  assert.ok(!text.includes("[") && !text.includes("]"), text);
});

test("fixPlain gives the corrected and the original sentence", () => {
  const t = "She [[go>>goes]] to school every day.";
  assert.equal(fixPlain(t, "right"), "She goes to school every day.");
  assert.equal(fixPlain(t, "wrong"), "She go to school every day.");
  assert.equal(fixPlain("He [[is>>]] plays football.", "right"), "He plays football.");
  assert.equal(fixPlain("I [[>>am]] happy.", "wrong"), "I happy.");
  // punctuation stays attached to the corrected word
  assert.equal(fixPlain("It was [[bed>>bad]].", "right"), "It was bad.");
});

test("fixCount", () => {
  assert.equal(fixCount("no marks"), 0);
  assert.equal(fixCount("[[a>>b]] and [[c>>d]]"), 2);
});

test("cleanFixText keeps valid marks untouched", () => {
  const t = "I [[were>>was]] at school [[yesterday>>yesterday]].";
  // the second mark has identical sides: it becomes plain text, the first stays
  assert.equal(cleanFixText(t), "I [[were>>was]] at school yesterday.");
});

test("cleanFixText turns unusable marks into the corrected plain text", () => {
  const long = "x".repeat(FIX_SIDE_MAX + 1);
  assert.equal(cleanFixText(`A [[${long}>>fine]] b`), "A fine b");
  assert.equal(cleanFixText(`A [[bad>>${long}]] b`), `A ${long} b`);
  // an over-long deletion simply disappears
  assert.equal(cleanFixText(`A [[${long}>>]] b`), "A b");
  assert.equal(cleanFixText("A [[>>]] b"), "A b");
});

test(`cleanFixText allows at most ${FIX_MAX_MARKS} marks`, () => {
  const t = Array.from({ length: 8 }, (_, i) => `[[w${i}>>r${i}]]`).join(" ");
  const out = cleanFixText(t);
  assert.equal(fixCount(out), FIX_MAX_MARKS);
  assert.ok(out.includes(`r${FIX_MAX_MARKS}`) && !out.includes(`[[w${FIX_MAX_MARKS}`));
});

test("cleanFixText never cuts through a mark when it shortens the text", () => {
  const t = `${"word ".repeat(30)}[[go>>goes]] home`;
  const out = cleanFixText(t, 150);
  assert.ok(out.length <= 150);
  assert.ok(!out.includes("[[") || out.includes("]]"), out);
  assert.equal((out.match(/\[\[/g) ?? []).length, (out.match(/\]\]/g) ?? []).length);
  // when the mark fits, it is kept
  const kept = cleanFixText(`${"word ".repeat(10)}[[go>>goes]] home`, 150);
  assert.equal(fixCount(kept), 1);
});

test("fixTokens keeps punctuation glued to a correction and never joins across spaces", () => {
  const tokens = fixTokens(parseFix("She [[go>>goes]], then ([[run>>runs]]) away."));
  const shape = tokens.map((t) => t.map((a) => (a.type === "word" ? a.text : `<${a.wrong}>${a.right}>`)).join("+"));
  assert.deepEqual(shape, ["She", "<go>goes>+,", "then", "(+<run>runs>+)", "away."]);
});

test("fixTokens numbers the corrections in reading order", () => {
  const units = fixTokens(parseFix("[[a>>b]] x [[c>>d]] y [[e>>f]]")).flat().flatMap((a) => (a.type === "unit" ? [a.index] : []));
  assert.deepEqual(units, [0, 1, 2]);
});

test("fixMarkPositions: increasing, inside 0..1", () => {
  const pos = fixMarkPositions("She [[go>>goes]] to school and [[he>>she]] runs.");
  assert.equal(pos.length, 2);
  assert.ok(pos[0] > 0 && pos[1] < 1 && pos[0] < pos[1]);
  assert.deepEqual(fixMarkPositions("nothing to fix"), []);
});

test("fixTipAt writes the sentence first, then visits the corrections", () => {
  const base = { x: 100, y: 50, w: 400, lines: 1, pitch: 40, positions: [0.3, 0.8] };
  const start = fixTipAt({ ...base, progress: 0 });
  const endWrite = fixTipAt({ ...base, progress: 0.4 });
  assert.ok(start.x <= 101);
  assert.ok(endWrite.x > 480, `x=${endWrite.x}`);
  // 2nd phase: first correction near 30 % of the line
  const first = fixTipAt({ ...base, progress: 0.4 + 0.6 * 0.1 });
  assert.ok(Math.abs(first.x - (100 + 0.3 * 400)) < 1);
  const second = fixTipAt({ ...base, progress: 0.4 + 0.6 * 0.6 });
  assert.ok(Math.abs(second.x - (100 + 0.8 * 400)) < 1);
  // no corrections: the sentence is simply written over the whole progress
  const plain = fixTipAt({ ...base, positions: [], progress: 1 });
  assert.ok(plain.x > 480);
});

test("fixTipAt follows a wrapped sentence line by line", () => {
  const base = { x: 0, y: 0, w: 300, lines: 3, pitch: 40, positions: [] as number[] };
  assert.equal(Math.floor(fixTipAt({ ...base, progress: 0.2 }).y / 40), 0);
  assert.equal(Math.floor(fixTipAt({ ...base, progress: 0.5 }).y / 40), 1);
  assert.equal(Math.floor(fixTipAt({ ...base, progress: 0.95 }).y / 40), 2);
});
