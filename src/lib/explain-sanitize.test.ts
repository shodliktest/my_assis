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
