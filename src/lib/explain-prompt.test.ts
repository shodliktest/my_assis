import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSystemPrompt, EXAMPLE_PROCESS, EXAMPLE_USER_DATA } from "./explain-prompt.ts";
import { sanitizeLessonPayload } from "./explain-sanitize.ts";
import { DRAW_KINDS, PAGE_H, toPageLesson, type DrawItem, type Lesson } from "./lesson.ts";

const ALLOWED_IN_PROMPT = [
  "title",
  "box",
  "text",
  "formula",
  "table",
  "chips",
  "flow",
  "bars",
  "callout",
];

test("prompt no longer forces the grammar template on every topic", () => {
  for (const mode of ["short", "full"] as const) {
    const p = buildSystemPrompt(mode);
    assert.doesNotMatch(p, /Majburiy (tuzilma|oqim)/i);
    assert.doesNotMatch(p, /I am reading\. \(Men/);
    assert.match(p, /FAQAT til\/grammatika savollarida/);
    assert.match(p, /JARAYON/);
    assert.match(p, /TAQQOSLASH/);
    assert.match(p, /MASALA\/FORMULA/);
    assert.match(p, /AYNAN shuni chizing/);
    assert.match(p, /JSON/, "Groq json_object mode requires the word JSON in the prompt");
  }
});

test("modes differ only where they should", () => {
  const short = buildSystemPrompt("short");
  const full = buildSystemPrompt("full");
  assert.match(short, /QISQA — 3–5 beat/);
  assert.match(full, /TO'LIQ — 5–9 beat/);
  assert.doesNotMatch(short, /TO'LIQ — 5–9/);
});

test("every element kind the prompt offers exists in the renderer", () => {
  for (const kind of ALLOWED_IN_PROMPT) {
    assert.ok((DRAW_KINDS as string[]).includes(kind), `${kind} missing from DRAW_KINDS`);
  }
});

test("the prompt stays compact (Groq per-minute token budget)", () => {
  // Uzbek tokenises at roughly 2.5–3 chars/token; keep input well under 3.2k tokens.
  for (const mode of ["short", "full"] as const) {
    const chars = buildSystemPrompt(mode).length;
    assert.ok(chars < 9500, `${mode} prompt is ${chars} chars`);
  }
});

test("the examples inside the prompt are valid JSON the app accepts unchanged", () => {
  const p = buildSystemPrompt("full");
  for (const example of [EXAMPLE_PROCESS, EXAMPLE_USER_DATA]) {
    const line = p.split("\n").find((l) => l.startsWith("Javob: ") && l.includes(example.title));
    assert.ok(line, `example "${example.title}" is embedded in the prompt`);
    const parsed = JSON.parse(line.slice("Javob: ".length));
    assert.deepEqual(parsed, example, "JSON in prompt round-trips");

    const lesson = sanitizeLessonPayload(parsed);
    assert.ok(lesson, "sanitizer accepts it");
    assert.equal(lesson.beats.length, example.beats.length, "no beat dropped");
    for (const [i, beat] of lesson.beats.entries()) {
      assert.equal(beat.items.length, example.beats[i].items.length, "no item dropped");
      assert.ok(beat.items.length <= 8);
      for (const item of beat.items) {
        assert.ok(ALLOWED_IN_PROMPT.includes(item.kind), `unexpected kind ${item.kind}`);
      }
    }
  }
});

function overlap(a: DrawItem, b: DrawItem) {
  const ah = a.h ?? 0;
  const bh = b.h ?? 0;
  return a.y < b.y + bh - 0.5 && b.y < a.y + ah - 0.5;
}

for (const mode of ["short", "full"] as const) {
  test(`example lessons lay out cleanly in ${mode} mode: contained, ordered, no overlap`, () => {
    for (const example of [EXAMPLE_PROCESS, EXAMPLE_USER_DATA]) {
      const raw = sanitizeLessonPayload(example) as Lesson;
      const laid = toPageLesson(raw, PAGE_H[mode]);
      for (const beat of laid.beats) {
        const boxes = beat.items.filter((i) => i.kind === "box");
        const content = beat.items.filter((i) => !["box", "title"].includes(i.kind));
        // Every content row sits inside some box.
        for (const c of content) {
          const host = boxes.find((b) => c.y >= b.y - 0.5 && c.y + (c.h ?? 0) <= b.y + (b.h ?? 0) + 0.5);
          assert.ok(host, `${example.title}/${mode}: "${c.kind}" at y=${c.y} escapes its box`);
        }
        // No two content rows collide.
        for (let i = 0; i < content.length; i++) {
          for (let j = i + 1; j < content.length; j++) {
            assert.ok(!overlap(content[i], content[j]), `${mode}: ${content[i].kind} overlaps ${content[j].kind}`);
          }
        }
        // Diagram rows get real pixel heights.
        for (const c of content.filter((i) => i.kind === "flow" || i.kind === "bars")) {
          assert.ok((c.h ?? 0) >= 90, `${c.kind} height ${c.h}`);
        }
      }
    }
  });
}
