import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildSystemPrompt,
  EXAMPLE_CODE,
  EXAMPLE_ENGLISH,
  EXAMPLE_ENGLISH_PRACTICE,
  EXAMPLE_GRAPH,
  EXAMPLE_HISTORY,
  EXAMPLE_PRACTICE,
  EXAMPLE_PROCESS,
  EXAMPLE_PROOFREAD,
  LESSON_ICONS,
  EXAMPLE_USER_DATA,
  isCodeQuestion,
  isEnglishQuestion,
  isMathQuestion,
  isProofreadQuestion,
  needsReasoning,
  pickExample,
  type PromptExample,
} from "./explain-prompt.ts";
import { sanitizeLessonPayload } from "./explain-sanitize.ts";
import { FIX_MAX_MARKS, FIX_SIDE_MAX, FIX_TEXT_MAX } from "./fix-markup.ts";
import { ICON_IDS } from "./icon-ids.ts";
import { displayText, renderSpoken, segments } from "./spoken.ts";
import { DRAW_KINDS, PAGE_H, toPageLesson, type DrawItem, type Lesson } from "./lesson.ts";

const ALLOWED_IN_PROMPT = [
  "title", "box", "text", "fix", "formula", "table", "chips", "flow", "bars", "graph", "code", "callout",
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
  assert.match(buildSystemPrompt("full"), /TO'LIQ — 6–10 beat/);
  assert.doesNotMatch(buildSystemPrompt("short"), /TO'LIQ — 6–10/);
  // the main half of a two-part lesson is shorter: the practice half is written elsewhere
  assert.match(buildSystemPrompt("full", "Hujayra nima?", "main"), /TO'LIQ, ASOSIY QISM — 5–8 beat/);
  assert.doesNotMatch(buildSystemPrompt("full", "Hujayra nima?"), /ASOSIY QISM/);
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

const PROOF_Q = 'Mana gapim: "She go to school and he don\'t like it." Xatolarini tuzat.';
const EXAMPLES: [string, PromptExample, string, ("main" | "practice")?][] = [
  ["process", EXAMPLE_PROCESS, "Fotosintez nima?"],
  ["data", EXAMPLE_USER_DATA, "Olma 12, nok 30, anor 18 diagramma"],
  ["graph", EXAMPLE_GRAPH, "X=10 Y=-10 parabola"],
  ["code", EXAMPLE_CODE, "Python for tsikl"],
  ["history", EXAMPLE_HISTORY, "Amir Temur kim bo'lgan?"],
  ["english", EXAMPLE_ENGLISH, "A va an artikllari"],
  ["proofread", EXAMPLE_PROOFREAD, PROOF_Q],
  ["practice", EXAMPLE_PRACTICE, "Fotosintez nima?", "practice"],
  ["english practice", EXAMPLE_ENGLISH_PRACTICE, "Was va were", "practice"],
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
  for (const [name, example, question, part] of EXAMPLES) {
    const p = buildSystemPrompt("full", question, part);
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
    if (part === "practice") assert.ok(!/"plan":\{/.test(p.split("CHIQISH:")[1].split("\n\n")[0]), `${name}: the practice part needs no plan`);
  }
});

test("the red-pen examples really use fix, and every fix mark is within the limits the prompt states", () => {
  for (const example of [EXAMPLE_PROOFREAD, EXAMPLE_PRACTICE, EXAMPLE_ENGLISH, EXAMPLE_ENGLISH_PRACTICE]) {
    const fixes = example.beats.flatMap((b) => b.items.filter((i) => i.kind === "fix"));
    assert.ok(fixes.length > 0);
    const lesson = sanitizeLessonPayload(example)!;
    const kept = lesson.beats.flatMap((b) => b.items.filter((i) => i.kind === "fix"));
    assert.equal(kept.length, fixes.length, "the sanitizer keeps every fix row");
    for (const item of kept) assert.match(item.text ?? "", /\[\[[^\]]*(?:>>|->|=>|→)[^\]]*\]\]/, "marks survive sanitizing");
  }
  const doc = buildSystemPrompt("full", "Hujayra nima?").match(/\nfix — [^\n]*/)![0];
  assert.match(doc, /\[\[xato>>to'g'ri\]\]/);
  const side = Number(doc.match(/Har tomon ≤ (\d+)/)![1]);
  const marks = Number(doc.match(/≤ (\d+) tuzatish/)![1]);
  const text = Number(doc.match(/butun text ≤ (\d+)/)![1]);
  assert.ok(side <= FIX_SIDE_MAX && marks <= FIX_MAX_MARKS && text <= FIX_TEXT_MAX, "the prompt asks for less than the sanitizer allows");
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
  assert.ok(renderSpoken(beat.speech).includes("ay voz"), "the voice says it in Uzbek letters");
  assert.ok(displayText(beat.speech).includes("I was"), "shown text keeps correct English");
  // board and caption are plain, correct text: no markers, no respelling
  const board = JSON.stringify(beat.items) + beat.caption;
  assert.doesNotMatch(board, /\{\{|\}\}|ay voz|yu vyor/);
  assert.match(board, /She was at home/);
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

test("English grammar, FULL: the prompt demands every part of a complete lesson", () => {
  const p = buildSystemPrompt("full", "Present Continuous nima?");
  for (const part of [
    "TO'LIQ DARS",
    "Darak (+), inkor", // the three sentence types
    "so'roq (?)",
    "qisqa javob",
    "infinitive (to + V)",
    "imlo (-ing, -s/-es, -ed)",
    "Signal so'zlar",
    "ISHLATILMAYDI",
    "Keng tarqalgan xatolar",
    "mini-test",
    "grammatik jihatdan TO'G'RI",
  ]) {
    assert.ok(p.includes(part), `missing: ${part}`);
  }
  assert.match(p, /TO'LIQ — 8–11 beat/);
  assert.doesNotMatch(p, /TO'LIQ — 5–9 beat/);
  assert.match(p, /fix qatori/, "mistakes are marked with the red pen");
});

test("English grammar, SHORT: only the compact outline, no 11-part checklist", () => {
  const p = buildSystemPrompt("short", "Present Continuous nima?");
  assert.match(p, /formula \(\+ − \?\)/);
  assert.doesNotMatch(p, /TO'LIQ DARS/);
  assert.match(p, /QISQA — 3–5 beat/);
});

test("a question only pays for the subjects and element kinds it can use", () => {
  const english = buildSystemPrompt("full", "Past Simple nima?");
  for (const other of ["BIOLOGIYA", "KIMYO", "FIZIKA", "FALSAFA", "GEOGRAFIYA"]) {
    assert.ok(!english.includes(`• ${other}:`), `${other} should not be sent for an English question`);
  }
  for (const kind of ["graph", "timeline", "icons", "bars", "code"]) {
    assert.ok(!english.includes(`\n${kind} — `), `${kind} is not documented for English`);
  }
  for (const kind of ["table", "chips", "callout", "box", "flow"]) assert.ok(english.includes(`\n${kind} — `), kind);

  const math = buildSystemPrompt("full", "y = x^2 grafigi");
  assert.ok(math.includes("\ngraph — ") && !math.includes("\nicons — ") && !math.includes("\ntimeline — "));
  assert.ok(math.includes("• MATEMATIKA:") && math.includes("• FIZIKA:") && !math.includes("• TARIX:"));

  // unknown subject: everything stays available
  const general = buildSystemPrompt("full", "Hujayra nima?");
  for (const kind of ["graph", "timeline", "icons", "bars", "code", "table"]) assert.ok(general.includes(`\n${kind} — `), kind);
  for (const subject of SUBJECTS) assert.ok(general.includes(`• ${subject}:`), subject);
});

test("the diagram sentence lists only kinds that are documented in the same prompt", () => {
  const p = buildSystemPrompt("full", "Past Simple nima?");
  assert.match(p, /Har darsda kamida bitta chizma bo'lsin \(flow yoki table\)/);
  assert.match(buildSystemPrompt("full", "Hujayra nima?"), /\(flow, icons, timeline, bars, table, graph yoki code\)/);
});

test("more English grammar topics are recognised (not only tenses)", () => {
  for (const q of [
    "Modal verbs nima?",
    "Infinitive va gerund farqi",
    "To be fe'li",
    "There is va there are",
    "Passive voice qanday tuziladi",
    "Conditionals haqida",
    "Comparative va superlative",
    "Used to nima?",
    "Predloglar in on at",
    "Present Perfect",
    "Ingliz tilida savol berish",
  ]) {
    assert.equal(pickExample(q).example, EXAMPLE_ENGLISH, q);
  }
  for (const q of ["Hujayra nima?", "Amir Temur kim bo'lgan?", "Ot so'z turkumi nima?"]) {
    assert.notEqual(pickExample(q).example, EXAMPLE_ENGLISH, q);
  }
});

test("the English example teaches the COMPLETE shape: all sentence types and a mistakes beat", () => {
  const text = JSON.stringify(EXAMPLE_ENGLISH);
  for (const part of ["Darak (+)", "Inkor (−)", "So'roq (?)", "Qisqa javob"]) assert.ok(text.includes(part), part);
  const last = EXAMPLE_ENGLISH.beats.at(-1)!;
  const fixes = last.items.filter((i) => i.kind === "fix");
  assert.ok(fixes.length >= 2, "the last beat corrects mistakes with the red pen");
  for (const f of fixes) assert.match(String(f.text ?? ""), /\[\[.+?>>.*?\]\]/);
  assert.ok(last.speech.includes("qizil ruchka"), "the voice announces the correction");
  assert.ok(EXAMPLE_ENGLISH.beats.length >= 3);
});

test("English FULL prompt leaves room for a long answer under Groq's free per-request limit", () => {
  // ~2.8 chars/token: the prompt must leave at least 4k tokens of the 8k limit for the answer
  const tokens = Math.ceil(buildSystemPrompt("full", "Present Continuous nima?").length / 2.8) + 80;
  assert.ok(8000 - tokens - 250 >= 4000, `prompt too long for a full English lesson: ~${tokens} tokens`);
});

// A complete English lesson as the new prompt asks for it (10 beats: meaning, forms, short answers,
// spelling, signal words, exceptions, mistakes side by side, comparison, summary + practice).
const T = (rows: string[][]) => ({ kind: "table", rows });
const FULL_ENGLISH_LESSON = {
  plan: { type: "chet tili: grammatika", reading: "Present Continuous to'liq", assumptions: [], visuals: ["table"] },
  title: "Present Continuous",
  beats: [
    { speech: "Present Continuous — ayni damda davom etayotgan ish. {{I am reading|ay em riding}}.", caption: "Qachon ishlatiladi", items: [
      { kind: "title", text: "Present Continuous" }, { kind: "box" }, { kind: "text", text: "Qachon ishlatiladi", size: "lg" },
      T([["Holat", "Misol", "Tarjima"], ["Hozir", "I am reading.", "Men o'qiyapman."], ["Vaqtinchalik", "She is living here.", "U shu yerda turibdi."], ["Reja", "We are leaving.", "Biz ketyapmiz."]]),
      { kind: "callout", text: "Formula: am / is / are + V-ing", color: "#0f6b63" } ] },
    { speech: "Darak gapda {{am|em}}, {{is|iz}}, {{are|a}} ishlatiladi.", caption: "Darak shakli (+)", items: [
      { kind: "box" }, { kind: "text", text: "Darak (+)", size: "lg" },
      T([["Kim", "Fe'l", "Misol"], ["I", "am", "I am working."], ["he / she / it", "is", "She is working."], ["you / we / they", "are", "They are working."]]),
      { kind: "callout", text: "Qisqartma: I'm, he's, we're", color: "#b45309" } ] },
    { speech: "Inkorda {{not|not}} qo'shiladi.", caption: "Inkor shakli (−)", items: [
      { kind: "box" }, { kind: "text", text: "Inkor (−)", size: "lg" },
      T([["Kim", "Formula", "Misol"], ["I", "am not + V-ing", "I'm not sleeping."], ["he / she / it", "isn't + V-ing", "He isn't sleeping."], ["you / we / they", "aren't + V-ing", "They aren't sleeping."]]),
      { kind: "callout", text: "am not uchun amn't yo'q!", color: "#b42318" } ] },
    { speech: "So'roqda fe'l gap boshiga chiqadi.", caption: "So'roq va qisqa javob (?)", items: [
      { kind: "box" }, { kind: "text", text: "So'roq (?)", size: "lg" },
      T([["Gap turi", "Formula", "Misol"], ["Ha/yo'q", "Am/Is/Are + S + V-ing?", "Are you eating?"], ["Qisqa javob", "Yes, I am. / No, I'm not.", "Yes, I am."], ["So'roq so'zli", "Wh + is/are + S + V-ing?", "What are you doing?"]]) ] },
    { speech: "Fe'lga ing qo'shishda imlo qoidalari bor.", caption: "-ing imlo qoidalari", items: [
      { kind: "box" }, { kind: "text", text: "-ing qo'shish", size: "lg" },
      T([["Qoida", "Fe'l", "-ing"], ["Odatda +ing", "work", "working"], ["-e tushadi", "make", "making"], ["Undosh ikki barobar", "run", "running"], ["-ie → -y", "lie", "lying"]]) ] },
    { speech: "Signal so'zlar gap oxirida yoki boshida keladi.", caption: "Signal so'zlar", items: [
      { kind: "box" }, { kind: "text", text: "Signal so'zlar", size: "lg" },
      { kind: "chips", chips: ["now", "right now", "at the moment", "today", "Look!", "Listen!"] },
      { kind: "callout", text: "At the moment, she is studying.", color: "#1d4ed8" } ] },
    { speech: "Holat fe'llari Continuous da ishlatilmaydi.", caption: "Istisno: holat fe'llari", items: [
      { kind: "box" }, { kind: "text", text: "Ishlatilmaydi", size: "lg" },
      { kind: "chips", chips: ["know", "like", "love", "want", "need", "understand"] },
      { kind: "callout", text: "I know the answer. (I am knowing ✗)", color: "#b45309" } ] },
    { speech: "Keng tarqalgan xatolar.", caption: "Keng tarqalgan xatolar", items: [
      { kind: "box", side: "left", color: "#b42318" }, { kind: "text", text: "Xato", size: "lg" },
      { kind: "callout", text: "I am work now.", color: "#b42318" }, { kind: "callout", text: "She is know it.", color: "#b42318" },
      { kind: "box", side: "right", color: "#0f6b63" }, { kind: "text", text: "To'g'ri", size: "lg" },
      { kind: "callout", text: "I am working now.", color: "#0f6b63" }, { kind: "callout", text: "She knows it.", color: "#0f6b63" } ] },
    { speech: "Present Simple va Continuous farqi.", caption: "Simple va Continuous farqi", items: [
      { kind: "box" }, { kind: "text", text: "Farqi", size: "lg" },
      T([["", "Simple", "Continuous"], ["Ma'no", "odat, fakt", "hozir, vaqtincha"], ["Formula", "V / V-s", "am/is/are + V-ing"], ["Signal", "always, every day", "now, today"]]) ] },
    { speech: "Mini-mashq: to'g'ri variantni toping. Javob: are playing.", caption: "Xulosa va mini-mashq", items: [
      { kind: "box" }, { kind: "text", text: "Mini-mashq", size: "lg" },
      { kind: "text", text: "1. They ___ (play) now.  2. I ___ (not/sleep)." },
      { kind: "callout", text: "Javob: 1. are playing  2. am not sleeping", color: "#0f6b63" } ] },
  ],
};

test("a complete 10-beat English lesson passes the sanitizer and lays out on the board without overlaps", () => {
  const lesson = sanitizeLessonPayload(FULL_ENGLISH_LESSON)!;
  assert.equal(lesson.beats.length, 10, "no beat is dropped");
  const laid = toPageLesson(lesson, PAGE_H.full);
  type R = { id: string; kind: string; x: number; y: number; w: number; h: number };
  const rects: R[] = laid.beats.flatMap((b) =>
    b.items.map((i) => ({ id: i.id, kind: i.kind, x: i.x, y: i.y, w: i.w ?? 0, h: i.h ?? 0 })),
  );
  for (const r of rects) {
    assert.ok(r.x >= 0 && r.x + r.w <= 720 + 0.5, `${r.id} (${r.kind}) is inside the page width: x=${r.x} w=${r.w}`);
  }
  const content = rects.filter((r) => r.kind !== "box");
  for (let i = 0; i < content.length; i++) {
    for (let j = i + 1; j < content.length; j++) {
      const a = content[i], b = content[j];
      const overlap = a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
      assert.ok(!overlap, `${a.id} (${a.kind}) overlaps ${b.id} (${b.kind})`);
    }
  }
  // the speech keeps its markers for the voice and the board shows plain English
  assert.ok(renderSpoken(lesson.beats[0].speech).includes("ay em riding"));
  assert.doesNotMatch(JSON.stringify(laid.beats.map((b) => b.items)), /\{\{|ay em riding/);
});

test("a question that hands over a text to check is recognised and gets the red-pen example", () => {
  for (const q of [
    PROOF_Q,
    "Mana matnim, tekshirib bering: I has a book",
    "Check my sentence: he go home",
    "Please correct this: they is happy",
    "Insho xatolarimni top",
    "Bu gapni to'g'rila: she don't know",
  ]) {
    assert.equal(isProofreadQuestion(q), true, q);
  }
  for (const q of ["Present Continuous nima?", "Fotosintez nima?", "Python da for tsikl", "Hujayra tuzilishi"]) {
    assert.equal(isProofreadQuestion(q), false, q);
  }
  assert.equal(pickExample(PROOF_Q).example, EXAMPLE_PROOFREAD);
  const p = buildSystemPrompt("short", PROOF_Q);
  assert.match(p, /MATNNI TEKSHIRISH/);
  assert.ok(p.includes("\nfix — "), "fix is documented even in short mode when a text is to be checked");
  // code and maths questions keep their own example, the red pen is still allowed there
  assert.equal(pickExample("Python kodimni tekshir: for i in range(5) print(i)").example, EXAMPLE_CODE);
});

test("an English sentence inside the question is enough to treat it as an English question", () => {
  assert.equal(isEnglishQuestion('"She go to school and he don\'t like it" xato'), true);
  assert.equal(isEnglishQuestion("I am happy va you are sad gaplarini tuzat"), true);
  // "it" and "to" alone are not proof: Uzbek has "it" (dog)
  assert.equal(isEnglishQuestion("It haqida qisqacha ayting"), false);
  assert.equal(isEnglishQuestion("Hujayra nima?"), false);
});

test("the red pen is offered in FULL mode and for checking, not in plain SHORT answers", () => {
  assert.ok(buildSystemPrompt("full", "Hujayra nima?").includes("\nfix — "));
  assert.ok(buildSystemPrompt("full", "Present Continuous nima?").includes("\nfix — "));
  assert.ok(!buildSystemPrompt("short", "Hujayra nima?").includes("\nfix — "));
  assert.ok(!buildSystemPrompt("short", "Present Continuous nima?").includes("\nfix — "));
  assert.doesNotMatch(buildSystemPrompt("short", "Hujayra nima?"), /\[\[xato>>/);
  // the professor block is for the full answer only
  assert.match(buildSystemPrompt("full", "Hujayra nima?"), /PROFESSOR USLUBI/);
  assert.doesNotMatch(buildSystemPrompt("short", "Hujayra nima?"), /PROFESSOR USLUBI/);
});

test("the single-request full lesson asks for the red-pen beat and the mini-test itself", () => {
  const p = buildSystemPrompt("full", "Fotosintez nima?");
  assert.match(p, /XATOLARNI QIZIL RUCHKA BILAN TUZATING/);
  assert.match(p, /mini-test/);
  assert.doesNotMatch(p, /ALOHIDA qismda yoziladi/);
});

test("the main half of a two-part lesson leaves the red pen and the test to the practice half", () => {
  for (const q of ["Fotosintez nima?", "Present Continuous nima?", "X=10 Y=-10 parabola", "Python for tsikl"]) {
    const main = buildSystemPrompt("full", q, "main");
    assert.match(main, /ALOHIDA qismda yoziladi/, q);
    assert.doesNotMatch(main, /XATOLARNI QIZIL RUCHKA BILAN TUZATING/, q);
    assert.doesNotMatch(main, /Keng tarqalgan xatolar|Xulosa va mini-test/, q);
    assert.match(main, /PROFESSOR USLUBI/, q);
    assert.match(main, /"plan":\{/, q);
  }
});

test("the practice half is its own compact prompt: red pen, subtle cases, a short test, no plan", () => {
  for (const q of ["Fotosintez nima?", "Present Continuous nima?", "X=10 Y=-10 parabola", "Python for tsikl"]) {
    const p = buildSystemPrompt("full", q, "practice");
    assert.match(p, /AMALIY QISM/, q);
    for (const beat of ["Odatiy xatolar", "Nozik joylar", "O'zingizni sinang"]) assert.ok(p.includes(beat), `${q}: ${beat}`);
    assert.ok(p.includes("\nfix — "), q);
    assert.match(p, /JSON/);
    assert.ok(!p.includes('"plan":{') || p.indexOf('"plan":{') > p.indexOf("Javob:"), `${q}: no plan in the format`);
    assert.doesNotMatch(p, /• BIOLOGIYA:/, "no subject catalogue in the practice prompt");
    assert.ok(p.length < 7200, `${q}: practice prompt stays small (${p.length})`);
  }
  // short mode has no practice half: the part is ignored
  assert.equal(buildSystemPrompt("short", "Hujayra nima?", "practice"), buildSystemPrompt("short", "Hujayra nima?"));
  // a maths question keeps formula and code available for the red pen
  assert.ok(buildSystemPrompt("full", "y = x^2 grafigi", "practice").includes("\nformula — "));
  assert.ok(buildSystemPrompt("full", "Python for tsikl", "practice").includes("\ncode — "));
});

test("both halves of a two-part lesson stay under Groq's free per-request limit", () => {
  for (const q of ["Fotosintez nima?", "Present Continuous nima?", "Python for tsikl", "Amir Temur kim bo'lgan?"]) {
    for (const part of ["main", "practice"] as const) {
      const tokens = Math.ceil(buildSystemPrompt("full", q, part).length / 2.8) + 80;
      assert.ok(8000 - tokens - 250 >= (part === "main" ? 3400 : 3800), `${q}/${part}: ~${tokens} tokens`);
    }
  }
});
