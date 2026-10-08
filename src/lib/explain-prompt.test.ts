import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSystemPrompt,
  EXAMPLE_CODE,
  EXAMPLE_ENGLISH,
  EXAMPLE_GRAPH,
  EXAMPLE_HISTORY,
  EXAMPLE_PROCESS,
  LESSON_ICONS,
  EXAMPLE_USER_DATA,
  isCodeQuestion,
  isMathQuestion,
  needsReasoning,
  pickExample,
  type PromptExample,
} from "./explain-prompt.ts";
import { sanitizeLessonPayload } from "./explain-sanitize.ts";
import { ICON_IDS } from "./icon-ids.ts";
import { displayText, renderSpoken, segments } from "./spoken.ts";
import { DRAW_KINDS, PAGE_H, toPageLesson, type DrawItem, type Lesson } from "./lesson.ts";

const ALLOWED_IN_PROMPT = [
  "title", "box", "text", "formula", "table", "chips", "flow", "bars", "graph", "code", "callout",
  "timeline", "icons",
];

const SUBJECTS = [
  "BIOLOGIYA", "KIMYO", "MATEMATIKA", "FIZIKA", "ONA TILI", "ADABIYOT", "TARIX",
  "FALSAFA", "GEOGRAFIYA", "INFORMATIKA", "DASTURLASH", "MANTIQ", "CHET TILI",
];

test("prompt covers every school subject and no longer forces the grammar template", () => {
  for (const mode of ["short", "full"] as const) {
    const p = buildSystemPrompt(mode);
    for (const subject of SUBJECTS) assert.ok(p.includes(`• ${subject}:`), `missing ${subject}`);
    assert.doesNotMatch(p, /Majburiy (tuzilma|oqim)/i);
    assert.doesNotMatch(p, /I am reading\. \(Men/);
    assert.match(p, /FAQAT chet tili grammatikasida/);
    assert.match(p, /AYNAN chizing/);
    assert.match(p, /JSON/, "Groq json_object mode requires the word JSON in the prompt");
    assert.match(p, /"plan":\{/, "the model writes its reading of the question first");
  }
});

test("modes differ only where they should", () => {
  assert.match(buildSystemPrompt("short"), /QISQA — 3–5 beat/);
  assert.match(buildSystemPrompt("full"), /TO'LIQ — 5–9 beat/);
  assert.doesNotMatch(buildSystemPrompt("short"), /TO'LIQ — 5–9/);
});

test("every element kind the prompt offers exists in the renderer", () => {
  for (const kind of ALLOWED_IN_PROMPT) {
    assert.ok((DRAW_KINDS as string[]).includes(kind), `${kind} missing from DRAW_KINDS`);
  }
});

test("maths guidance is included only for maths questions", () => {
  const plain = buildSystemPrompt("full", "Hujayra nima?");
  const math = buildSystemPrompt("full", "X=10 Y=-10 oqida parabola qanday voladi");
  assert.doesNotMatch(plain, /MATEMATIK\/HISOBLASH SAVOLI/);
  assert.match(math, /MATEMATIK\/HISOBLASH SAVOLI/);
  assert.match(math, /cho'qqi \(a; b\)/);
  assert.ok(math.length > plain.length);
});

test("prompt size stays inside Groq's per-minute token budget", () => {
  // Uzbek is ~3 chars/token. Plain prompts under ~4k tokens, maths under ~4.7k.
  for (const mode of ["short", "full"] as const) {
    assert.ok(buildSystemPrompt(mode).length < 12500, `plain ${mode}`);
    assert.ok(buildSystemPrompt(mode, "y = x^2 grafigi").length < 14500, `math ${mode}`);
    assert.ok(buildSystemPrompt(mode, "Python da for tsikl").length < 12500, `code ${mode}`);
  }
});

test("the right worked example is picked for each kind of question", () => {
  assert.equal(pickExample("X=10 Y=-10 oqida parabola qanday voladi").example, EXAMPLE_GRAPH);
  assert.equal(pickExample("y = 2x + 1 grafigini chiz").example, EXAMPLE_GRAPH);
  assert.equal(pickExample("Python da for tsikl nima?").example, EXAMPLE_CODE);
  assert.equal(pickExample("SQL da JOIN qanday ishlaydi").example, EXAMPLE_CODE);
  assert.equal(pickExample("Olma 12, nok 30, anor 18 diagramma").example, EXAMPLE_USER_DATA);
  assert.equal(pickExample("Fotosintez nima?").example, EXAMPLE_PROCESS);
  assert.equal(pickExample("Amir Temur kim bo'lgan?").example, EXAMPLE_HISTORY);
  assert.equal(pickExample("Navoiy hayoti haqida").example, EXAMPLE_HISTORY);
  assert.equal(pickExample("Birinchi jahon urushi sabablari").example, EXAMPLE_HISTORY);
  assert.equal(pickExample("Hujayra nima?").example, EXAMPLE_PROCESS);
  assert.equal(pickExample("A va an artikllari").example, EXAMPLE_ENGLISH);
  assert.equal(pickExample("Present Continuous nima?").example, EXAMPLE_ENGLISH);
  assert.equal(pickExample("Ingliz tilida salomlashish").example, EXAMPLE_ENGLISH);
  assert.equal(pickExample("Python for tsikl").example, EXAMPLE_CODE, "code wins over the word 'for'");
});

test("question classifiers work across subjects", () => {
  for (const q of [
    "X=10 Y=-10 oqida parabola qanday voladi",
    "y=2x+1 grafigi",
    "sin x grafigini chiz",
    "f(x) = x^2 - 4 ildizlari",
    "Aylana tenglamasi markazi (2;1)",
    "Harorat grafigi: 12, 15, 11",
  ]) {
    assert.equal(isMathQuestion(q), true, q);
    assert.equal(needsReasoning(q), true, q);
  }
  for (const q of ["Python da funksiya yoz", "JavaScript massiv", "algoritm nima", "SQL SELECT"]) {
    assert.equal(isCodeQuestion(q), true, q);
    assert.equal(needsReasoning(q), true, q);
  }
  for (const q of [
    "Massasi 5 kg jism 2 m/s² tezlanish bilan harakatlanadi, kuchni toping",
    "25 ni ikkilik sanoq sistemasiga o'tkaz",
    "Chinlik jadvalini tuzing: A va B",
    "2H2 + O2 reaksiyasini tenglashtir",
  ]) {
    assert.equal(needsReasoning(q), true, q);
  }
  // Descriptive questions do not pay for slow reasoning.
  for (const q of [
    "Hujayra nima?",
    "Navoiy hayoti haqida",
    "Amir Temur kim bo'lgan?",
    "Falsafa nima?",
    "O'zbekiston iqlimi qanday?",
    "Ot so'z turkumi nima?",
    "Present Continuous nima?",
  ]) {
    assert.equal(needsReasoning(q), false, q);
    assert.equal(isMathQuestion(q), false, q);
  }
});

const EXAMPLES: [string, PromptExample, string][] = [
  ["process", EXAMPLE_PROCESS, "Fotosintez nima?"],
  ["data", EXAMPLE_USER_DATA, "Olma 12, nok 30, anor 18 diagramma"],
  ["graph", EXAMPLE_GRAPH, "X=10 Y=-10 parabola"],
  ["code", EXAMPLE_CODE, "Python for tsikl"],
  ["history", EXAMPLE_HISTORY, "Amir Temur kim bo'lgan?"],
  ["english", EXAMPLE_ENGLISH, "A va an artikllari"],
];

test("the icon names offered in the prompt all exist, and the sanitizer repairs unknown ones", () => {
  for (const id of LESSON_ICONS) assert.ok((ICON_IDS as readonly string[]).includes(id), `unknown icon ${id}`);
  const p = buildSystemPrompt("full");
  for (const id of LESSON_ICONS) assert.ok(p.includes(id));
  const lesson = sanitizeLessonPayload({
    title: "t",
    beats: [{ speech: "s", items: [{ kind: "icons", rows: [["SUN", "Quyosh"], ["dragon", "Ajdar"]] }] }],
  })!;
  assert.deepEqual(lesson.beats[0].items[0].rows, [["sun", "Quyosh"], ["idea", "Ajdar"]]);
});

test("every example embedded in the prompt is valid JSON the app accepts unchanged", () => {
  for (const [name, example, question] of EXAMPLES) {
    const p = buildSystemPrompt("full", question);
    const line = p.split("\n").find((l) => l.startsWith("Javob: "));
    assert.ok(line, `${name}: example is embedded`);
    const parsed = JSON.parse(line.slice("Javob: ".length));
    assert.deepEqual(parsed, example, `${name}: JSON round-trips`);

    const lesson = sanitizeLessonPayload(parsed);
    assert.ok(lesson, `${name}: sanitizer accepts it`);
    assert.equal(lesson.beats.length, example.beats.length, `${name}: no beat dropped`);
    for (const [i, beat] of lesson.beats.entries()) {
      assert.equal(beat.items.length, example.beats[i].items.length, `${name}: no item dropped`);
      assert.ok(beat.items.length <= 8);
      for (const item of beat.items) {
        assert.ok(ALLOWED_IN_PROMPT.includes(item.kind), `${name}: unexpected kind ${item.kind}`);
      }
    }
    assert.ok(example.plan.reading.length > 0 && example.plan.visuals.length > 0);
  }
});

const overlap = (a: DrawItem, b: DrawItem) =>
  a.y < b.y + (b.h ?? 0) - 0.5 &&
  b.y < a.y + (a.h ?? 0) - 0.5 &&
  a.x < b.x + (b.w ?? 0) - 0.5 &&
  b.x < a.x + (a.w ?? 0) - 0.5;

for (const mode of ["short", "full"] as const) {
  test(`all examples lay out cleanly in ${mode} mode: contained, ordered, no overlap`, () => {
    for (const [name, example] of EXAMPLES) {
      const raw = sanitizeLessonPayload(example) as Lesson;
      const laid = toPageLesson(raw, PAGE_H[mode]);
      for (const beat of laid.beats) {
        const boxes = beat.items.filter((i) => i.kind === "box");
        const content = beat.items.filter((i) => !["box", "title"].includes(i.kind));
        for (const c of content) {
          const host = boxes.find(
            (b) =>
              c.y >= b.y - 0.5 &&
              c.y + (c.h ?? 0) <= b.y + (b.h ?? 0) + 0.5 &&
              c.x >= b.x - 0.5 &&
              c.x + (c.w ?? 0) <= b.x + (b.w ?? 0) + 0.5,
          );
          assert.ok(host, `${name}/${mode}: ${c.kind} at y=${c.y} escapes its box`);
        }
        for (let i = 0; i < boxes.length; i++) {
          for (let j = i + 1; j < boxes.length; j++) {
            assert.ok(!overlap(boxes[i], boxes[j]), `${name}/${mode}: boxes overlap`);
          }
        }
        for (const b of boxes) assert.ok(b.x + (b.w ?? 0) <= 720, `${name}: box leaves the page`);
        for (let i = 0; i < content.length; i++) {
          for (let j = i + 1; j < content.length; j++) {
            assert.ok(!overlap(content[i], content[j]), `${name}/${mode}: ${content[i].kind} overlaps ${content[j].kind}`);
          }
        }
        for (const c of content.filter((i) => ["flow", "bars", "graph", "code", "timeline", "icons"].includes(i.kind))) {
          assert.ok((c.h ?? 0) >= 60, `${name}: ${c.kind} height ${c.h}`);
        }
        for (const c of content.filter((i) => i.kind === "graph")) {
          assert.ok((c.h ?? 0) >= 300, `${name}: graph height ${c.h}`);
        }
      }
    }
  });
}

test("English is taught as {{shown|said}}: correct on the board, Uzbek letters for the voice", () => {
  const p = buildSystemPrompt("full", "Present Simple nima?");
  assert.match(p, /\{\{to'g'ri yozuv\|o'zbekcha talaffuz\}\}/);
  assert.match(p, /\{\{I am work\|ay em vork\}\}/);
  assert.match(p, /belgi YOZMANG/);
  // the voice only ever receives plain Uzbek-letter text
  for (const [name, example] of EXAMPLES) {
    for (const beat of example.beats) {
      assert.equal(segments(beat.speech).every((s) => !/[{}|]/.test(s.text)), true, `${name}: well-formed markers`);
      assert.doesNotMatch(renderSpoken(beat.speech), /[{}|]/, `${name}: no markers reach the voice`);
      assert.doesNotMatch(displayText(beat.speech), /[{}|]/, `${name}: no markers in displayed text`);
    }
  }
  const beat = EXAMPLE_ENGLISH.beats[0];
  assert.ok(renderSpoken(beat.speech).includes("en epl"), "the voice says it in Uzbek letters");
  assert.ok(displayText(beat.speech).includes("an apple"), "shown text keeps correct English");
  // board and caption are plain, correct text: no markers, no respelling
  const board = JSON.stringify(beat.items) + beat.caption;
  assert.doesNotMatch(board, /\{\{|\}\}|en epl|ey buk/);
  assert.match(board, /an apple/);
});

test("markers in a model's board text or caption are resolved to the correct spelling", () => {
  const lesson = sanitizeLessonPayload({
    title: "{{Articles|artikls}}",
    beats: [
      {
        speech: "Bu {{an apple|en epl}} haqida.",
        caption: "Shu {{an apple|en epl}}",
        items: [{ kind: "text", text: "{{an apple|en epl}}", x: 1, y: 1 }, { kind: "chips", chips: ["{{a|ey}}", "{{an|en}}", "the"] }],
      },
    ],
  })!;
  assert.equal(lesson.title, "Articles");
  assert.equal(lesson.beats[0].caption, "Shu an apple");
  assert.equal(lesson.beats[0].items[0].text, "an apple");
  assert.deepEqual(lesson.beats[0].items[1].chips, ["a", "an", "the"]);
  assert.equal(lesson.beats[0].speech, "Bu {{an apple|en epl}} haqida.", "the voice text keeps its markers");
  // caption falls back to the shown text when the model sends none
  const noCaption = sanitizeLessonPayload({
    beats: [{ speech: "Gap: {{I am work|ay em vork}}.", items: [{ kind: "text", text: "x", x: 1, y: 1 }] }],
  })!;
  assert.equal(noCaption.beats[0].caption, "Gap: I am work.");
});
