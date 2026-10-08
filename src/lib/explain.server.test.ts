import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { runExplain, parseExplainInput } from "./explain.server.ts";

const goodLesson = {
  title: "Test dars",
  beats: [{ speech: "Salom", caption: "Salom", items: [{ kind: "text", text: "Hello", x: 5, y: 5 }] }],
};
const ok = (content: unknown) =>
  new Response(JSON.stringify({ choices: [{ message: { content: typeof content === "string" ? content : JSON.stringify(content) } }] }), { status: 200 });
const status = (n: number) => new Response("{}", { status: n });

type Call = { url: string; key: string; model: string; body: any };
let calls: Call[] = [];
function mock(handler: (c: Call, n: number) => Response | Promise<Response>) {
  calls = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    const key = String((init.headers as Record<string, string>).Authorization).replace("Bearer ", "");
    const body = JSON.parse(String(init.body));
    const c = { url: String(url), key, model: body.model as string, body };
    calls.push(c);
    return handler(c, calls.length);
  }) as typeof fetch;
}
beforeEach(() => {
  for (const k of Object.keys(process.env)) if (/^(GROQ|XAI)_/.test(k)) delete process.env[k];
});

test("no keys: local lesson for known topics, friendly error otherwise", async () => {
  const known = await runExplain({ question: "Present Continuous nima?", mode: "full" });
  assert.equal(known.ok, true);
  const unknown = await runExplain({ question: "Fotosintez nima?", mode: "full" });
  assert.equal(unknown.ok, false);
});

test("happy path: first key, first model", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock(() => ok(goodLesson));
  const r = await runExplain({ question: "Fotosintez nima?", mode: "short" });
  assert.equal(r.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, "openai/gpt-oss-120b");
});

test("429 retires key1 and moves to key2 (not to the next model)", async () => {
  process.env.GROQ_API_KEY = "k1";
  process.env.GROQ_API_KEY1 = "k2";
  mock((c) => (c.key === "k1" ? status(429) : ok(goodLesson)));
  const r = await runExplain({ question: "Fotosintez nima?", mode: "full" });
  assert.equal(r.ok, true);
  assert.deepEqual(calls.map((c) => c.key), ["k1", "k2"]);
});

test("404 on a model falls through to the next model on the same key", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock((c) => (c.model === "openai/gpt-oss-120b" ? status(404) : ok(goodLesson)));
  const r = await runExplain({ question: "Fotosintez nima?", mode: "full" });
  assert.equal(r.ok, true);
  assert.equal(calls.length, 2);
});

test("GROQ_MODELS env overrides the model list", async () => {
  process.env.GROQ_API_KEY = "k1";
  process.env.GROQ_MODELS = "my/model-a, my/model-b";
  mock(() => ok(goodLesson));
  await runExplain({ question: "Fotosintez nima?", mode: "short" });
  assert.equal(calls[0].model, "my/model-a");
  delete process.env.GROQ_MODELS;
});

test("all Groq attempts fail -> xAI fallback answers", async () => {
  process.env.GROQ_API_KEY = "k1";
  process.env.XAI_API_KEY = "x1";
  mock((c) => (c.url.includes("x.ai") ? ok(goodLesson) : status(500)));
  const r = await runExplain({ question: "Fotosintez nima?", mode: "short" });
  assert.equal(r.ok, true);
  assert.ok(calls.at(-1)!.url.includes("x.ai"));
});

test("everything fails: topic with a local lesson still succeeds", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock(() => status(500));
  const r = await runExplain({ question: "Present Continuous nima?", mode: "full" });
  assert.equal(r.ok, true);
});

test("everything fails: unknown topic gets a friendly Uzbek error", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock(() => status(401));
  const r = await runExplain({ question: "Fotosintez nima?", mode: "full" });
  assert.equal(r.ok, false);
  assert.match((r as { error: string }).error, /AI xizmati/);
});

test("timeouts are reported as 'Javob kechikdi'", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock(() => { const e = new Error("t"); e.name = "TimeoutError"; throw e; });
  const r = await runExplain({ question: "Fotosintez nima?", mode: "full" });
  assert.equal(r.ok, false);
  assert.match((r as { error: string }).error, /kechikdi/);
});

test("messy but usable model output is repaired instead of rejected", async () => {
  process.env.GROQ_API_KEY = "k1";
  const messy = "```json\n" + JSON.stringify({ title: "x".repeat(300), beats: [{ speech: "s".repeat(2000), items: [{ kind: "weird", text: "t", x: "10%", y: "5" }] }] }) + "\n```";
  mock(() => ok(messy));
  const r = await runExplain({ question: "Fotosintez nima?", mode: "full" });
  assert.equal(r.ok, true);
});

test("unparseable output triggers exactly one repair attempt", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock((_c, n) => (n === 1 ? ok("kechirasiz, JSON yo'q") : ok(goodLesson)));
  const r = await runExplain({ question: "Fotosintez nima?", mode: "short" });
  assert.equal(r.ok, true);
  assert.equal(calls.length, 2);
});

test("input validation", () => {
  assert.equal(parseExplainInput(null), null);
  assert.equal(parseExplainInput({ question: "a" }), null);
  assert.equal(parseExplainInput({ question: "x".repeat(401) }), null);
  assert.equal(parseExplainInput({ question: 5 }), null);
  assert.deepEqual(parseExplainInput({ question: "  Salom dunyo ", mode: "short" }), { question: "Salom dunyo", mode: "short" });
  assert.equal(parseExplainInput({ question: "ok ok", mode: "weird" })!.mode, "full");
});

const systemOf = (c: Call): string => c.body.messages[0].content;

test("maths question: medium reasoning, bigger budget, graph guidance in the prompt", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock(() => ok(goodLesson));
  const r = await runExplain({ question: "X=10 Y=-10 oqida parabola qanday voladi", mode: "full" });
  assert.equal(r.ok, true);
  const body = calls[0].body;
  assert.equal(body.reasoning_effort, "medium");
  assert.equal(body.max_tokens, 5500);
  assert.match(systemOf(calls[0]), /MATEMATIK\/HISOBLASH SAVOLI/);
  assert.match(systemOf(calls[0]), /"kind":"graph"/);
  assert.equal(body.messages[1].content, "X=10 Y=-10 oqida parabola qanday voladi", "the user's words are passed through unchanged");
});

test("descriptive question: low reasoning, normal budget, no maths section", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock(() => ok(goodLesson));
  await runExplain({ question: "Hujayra nima?", mode: "full" });
  const body = calls[0].body;
  assert.equal(body.reasoning_effort, "low");
  assert.equal(body.max_tokens, 4000);
  assert.doesNotMatch(systemOf(calls[0]), /MATEMATIK\/HISOBLASH SAVOLI/);
  assert.match(systemOf(calls[0]), /Yomg'ir qanday hosil bo'ladi/, "default process example");
});

test("code question: reasoning on and the code example is shown", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock(() => ok(goodLesson));
  await runExplain({ question: "Python da for tsikl nima?", mode: "short" });
  const body = calls[0].body;
  assert.equal(body.reasoning_effort, "medium");
  assert.equal(body.max_tokens, 3500);
  assert.match(systemOf(calls[0]), /"kind":"code"/);
});

test("reasoning_effort is only sent to models that support it", async () => {
  process.env.GROQ_API_KEY = "k1";
  process.env.GROQ_MODELS = "qwen/some-model";
  mock(() => ok(goodLesson));
  await runExplain({ question: "y = x^2 grafigi", mode: "short" });
  assert.equal("reasoning_effort" in calls[0].body, false);
  delete process.env.GROQ_MODELS;
});

test("the repair attempt keeps the same reasoning settings and prompt", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock((_c, n) => (n === 1 ? ok("JSON emas") : ok(goodLesson)));
  const r = await runExplain({ question: "y = x^2 grafigi", mode: "short" });
  assert.equal(r.ok, true);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].body.reasoning_effort, "medium");
  assert.equal(systemOf(calls[1]), systemOf(calls[0]));
  assert.equal(calls[1].body.messages.length, 3, "extra JSON-only reminder is appended");
});

test("a model's graph and code survive the whole pipeline", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock(() =>
    ok({
      plan: { type: "matematika", reading: "parabola", assumptions: ["k=1"], visuals: ["graph"] },
      title: "Parabola",
      beats: [
        {
          speech: "Mana grafik.",
          caption: "Grafik",
          items: [
            { kind: "box" },
            { kind: "graph", graph: { fn: [{ expr: "(x-10)^2-10" }], points: [{ x: 10, y: -10, label: "cho'qqi" }], xmin: 0, xmax: 20 } },
            { kind: "code", text: "print(1)\nprint(2)" },
          ],
        },
      ],
    }),
  );
  const r = await runExplain({ question: "X=10 Y=-10 parabola", mode: "full" });
  assert.ok(r.ok);
  const items = (r as { lesson: { beats: { items: { kind: string; graph?: { fn: unknown[] }; text?: string }[] }[] } }).lesson.beats[0].items;
  assert.equal(items.find((i) => i.kind === "graph")?.graph?.fn.length, 1);
  assert.equal(items.find((i) => i.kind === "code")?.text, "print(1)\nprint(2)");
});
