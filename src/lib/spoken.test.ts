import assert from "node:assert/strict";
import { test } from "node:test";
import { clampSpeech, displayText, renderSpoken, segments } from "./spoken.ts";

test("the user's example: shown correctly, said in Uzbek letters", () => {
  const s = "Mana gap: {{I am work|ay em vork}} — to'g'rimi?";
  assert.equal(displayText(s), "Mana gap: I am work — to'g'rimi?");
  assert.equal(renderSpoken(s), "Mana gap: ay em vork — to'g'rimi?");
});

test("several fragments, plain text between them stays Uzbek", () => {
  const s = "Avval {{a|ey}} keladi, keyin {{an apple|en epl}} va oxirida shu.";
  assert.equal(displayText(s), "Avval a keladi, keyin an apple va oxirida shu.");
  assert.equal(renderSpoken(s), "Avval ey keladi, keyin en epl va oxirida shu.");
});

test("unmarked text goes through the safety-net adapter, marked text never does", () => {
  const shout = (t: string) => t.toUpperCase();
  assert.equal(renderSpoken("salom {{hello|helou}} dunyo", shout), "SALOM helou DUNYO");
  assert.equal(renderSpoken("faqat oddiy matn", shout), "FAQAT ODDIY MATN");
});

test("both separators work, spaces are tidy", () => {
  assert.equal(renderSpoken("{{Present Simple||prezent simpl}}"), "prezent simpl");
  assert.equal(renderSpoken("a{{b|c}}d"), "a c d");
  assert.equal(renderSpoken("  {{x|y}}   z  "), "y z");
});

test("broken or half-written markers never leak braces into speech or display", () => {
  for (const bad of ["{{I am work|ay em", "I am}} work", "{{|}}", "{{only shown}}", "x {{ }} y", "{{a|b}}}}", "{{{{a|b}}"]) {
    assert.doesNotMatch(displayText(bad), /[{}]/, bad);
    assert.doesNotMatch(renderSpoken(bad), /[{}|]/, bad);
  }
  assert.equal(displayText("{{I am work|ay em"), "I am work ay em");
});

test("a pair with an empty pronunciation falls back to the shown text (adapted)", () => {
  assert.equal(renderSpoken("{{hello|}} do'st", (t) => `<${t}>`), "<hello>< do'st>");
});

test("segments expose which parts are already phonetic", () => {
  assert.deepEqual(segments("bu {{a|ey}} edi"), [{ text: "bu " }, { text: "a", said: "ey" }, { text: " edi" }]);
});

test("clampSpeech never cuts a marker in half", () => {
  const s = `${"x".repeat(10)} {{I am work|ay em vork}} oxiri`;
  assert.equal(clampSpeech(s, 20), "xxxxxxxxxx");
  assert.equal(clampSpeech(s, 100), s);
  assert.equal(clampSpeech("  salom  ", 100), "salom");
});

test("plain text without any marker is untouched", () => {
  const s = "Oddiy o'zbekcha gap, hech qanday belgi yo'q.";
  assert.equal(displayText(s), s);
  assert.equal(renderSpoken(s), s);
});

test("no stray space is left before punctuation", () => {
  assert.equal(renderSpoken("Gap: {{I am work|ay em vork}}."), "Gap: ay em vork.");
  assert.equal(renderSpoken("{{a|ey}}, {{an|en}}!"), "ey, en!");
});
