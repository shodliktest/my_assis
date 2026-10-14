import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { runExplain, parseExplainInput, resetFailoverState, fitOutputBudget } from "./explain.server.ts";

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
  resetFailoverState();
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

test("429 on key1 moves to key2 on the same (best) model", async () => {
  process.env.GROQ_API_KEY = "k1";
  process.env.GROQ_API_KEY1 = "k2";
  mock((c) => (c.key === "k1" ? status(429) : ok(goodLesson)));
  const r = await runExplain({ question: "Fotosintez nima?", mode: "full" });
  assert.equal(r.ok, true);
  assert.deepEqual(calls.map((c) => c.key), ["k1", "k2"]);
});

test("429 on every key for the best model -> the next model (own limit bucket) answers", async () => {
  process.env.GROQ_API_KEY = "k1";
  process.env.GROQ_API_KEY1 = "k2";
  mock((c) => (c.model === "openai/gpt-oss-120b" ? status(429) : ok(goodLesson)));
  const r = await runExplain({ question: "Fotosintez nima?", mode: "full" });
  assert.equal(r.ok, true);
  assert.deepEqual(
    calls.map((c) => `${c.key}/${c.model}`),
    ["k1/openai/gpt-oss-120b", "k2/openai/gpt-oss-120b", "k1/qwen/qwen3.8-27b"],
  );
});

test("a key+model that answered 429 is left alone until retry-after has passed", async () => {
  process.env.GROQ_API_KEY = "k1"; // one account: one shared budget
  mock((c) =>
    c.model === "openai/gpt-oss-120b"
      ? new Response("{}", { status: 429, headers: { "retry-after": "30" } })
      : ok(goodLesson),
  );
  await runExplain({ question: "Fotosintez nima?", mode: "full" });
  assert.deepEqual(calls.map((c) => c.model), ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]);
  await runExplain({ question: "Mitoz nima?", mode: "full" });
  // second request goes straight to the model that still has quota
  assert.deepEqual(calls.slice(2).map((c) => c.model), ["qwen/qwen3.8-27b"]);
});

test("a 401/403 key is dropped for every model, the other key keeps working", async () => {
  process.env.GROQ_API_KEY = "bad";
  process.env.GROQ_API_KEY1 = "good";
  mock((c) => (c.key === "bad" ? status(401) : ok(goodLesson)));
  await runExplain({ question: "Fotosintez nima?", mode: "full" });
  await runExplain({ question: "Mitoz nima?", mode: "full" });
  await runExplain({ question: "Xloroplast nima?", mode: "full" });
  assert.equal(calls.filter((c) => c.key === "bad").length, 1, "the bad key must be tried only once");
  assert.equal(calls.filter((c) => c.key === "good").length, 3);
});

test("requests are spread over the keys instead of always starting on key 1", async () => {
  process.env.GROQ_API_KEY = "k1";
  process.env.GROQ_API_KEY1 = "k2";
  process.env.GROQ_API_KEY2 = "k3";
  mock(() => ok(goodLesson));
  for (const q of ["Birinchi savol?", "Ikkinchi savol?", "Uchinchi savol?", "To'rtinchi savol?"]) {
    await runExplain({ question: q, mode: "short" });
  }
  assert.deepEqual(calls.map((c) => c.key), ["k1", "k2", "k3", "k1"]);
});

test("every key+model is parked: friendly 'too many requests' message, no wasted calls", async () => {
  process.env.GROQ_API_KEY = "k1";
  process.env.GROQ_MODELS = "m/a";
  mock(() => new Response("{}", { status: 429, headers: { "retry-after": "40" } }));
  const first = await runExplain({ question: "Fotosintez nima?", mode: "full" });
  assert.equal(first.ok, false);
  assert.match((first as { error: string }).error, /So'rovlar/);
  const before = calls.length;
  const second = await runExplain({ question: "Mitoz nima?", mode: "full" });
  assert.equal(second.ok, false);
  assert.match((second as { error: string }).error, /So'rovlar/);
  assert.equal(calls.length, before, "no request is sent while everything is cooling down");
  delete process.env.GROQ_MODELS;
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

// ---- token budget, cut-off replies, notices -------------------------------------------------

const tooLarge = (limit: number, requested: number) =>
  new Response(
    JSON.stringify({
      error: {
        message: `Request too large for model \`openai/gpt-oss-120b\` in organization \`org_x\` service tier \`on_demand\` on tokens per minute (TPM): Limit ${limit}, Requested ${requested}, please reduce your message size and try again.`,
        type: "tokens",
      },
    }),
    { status: 413 },
  );
const cutOff = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: "length" }] }), { status: 200 });
const beat = (n: number) => ({ speech: `Gap ${n}`, caption: `Qadam ${n}`, items: [{ kind: "text", text: `Matn ${n}` }] });
const lessonOf = (from: number, to: number) => ({
  title: "Uzun dars",
  beats: Array.from({ length: to - from + 1 }, (_, i) => beat(from + i)),
});
/** Beats 1-3 complete, beat 4 cut off in the middle — what max_tokens leaves behind. */
const threeAndAHalf = () => {
  const json = JSON.stringify(lessonOf(1, 4));
  return json.slice(0, json.indexOf('"Gap 4"') + 4);
};

test("fitOutputBudget: fits input + output under the limit, never exceeds the wish, has a floor", () => {
  assert.equal(fitOutputBudget(5500, 3800, 8000), 3870);
  assert.equal(fitOutputBudget(2000, 1000, 8000), 2000, "never above what was asked for");
  assert.equal(fitOutputBudget(5500, 7000, 8000), 2500, "floor");
  assert.equal(fitOutputBudget(2000, 7000, 8000), 2000, "a short answer is not raised to the floor");
  assert.equal(fitOutputBudget(5200, 3480, 250000), 5200);
});

test("full English lesson asks for the bigger output budget and the complete-lesson checklist", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock(() => ok(goodLesson));
  await runExplain({ question: "Present Continuous nima?", mode: "full" });
  assert.equal(calls[0].body.max_tokens, 5200);
  assert.equal(calls[0].body.reasoning_effort, "low");
  assert.match(systemOf(calls[0]), /TO'LIQ DARS/);
  assert.match(systemOf(calls[0]), /8–11 beat/);
});

test("413: output budget shrinks to what Groq says fits, the request is retried at once and the limit remembered", async () => {
  process.env.GROQ_API_KEY = "k1";
  // 5500 requested output + 3800 input = 9300 > 8000
  mock((_c, n) => (n === 1 ? tooLarge(8000, 9300) : ok(goodLesson)));
  const r = await runExplain({ question: "X=10 Y=-10 oqida parabola qanday voladi", mode: "full" });
  assert.equal(r.ok, true);
  assert.equal(calls.length, 2, "one failed attempt, one retry on the same key and model");
  assert.equal(calls[0].body.max_tokens, 5500);
  assert.equal(calls[1].body.max_tokens, 3870);
  assert.equal(calls[1].model, calls[0].model);
  assert.equal(calls[1].key, calls[0].key);

  // the next request does not repeat the mistake
  await runExplain({ question: "y = 2x + 1 grafigi", mode: "full" });
  assert.equal(calls.length, 3, "no failing first attempt this time");
  assert.ok(calls[2].body.max_tokens < 5500 && calls[2].body.max_tokens >= 2500, String(calls[2].body.max_tokens));
});

test("413 without numbers in the message: the budget is estimated from the prompt size", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock((_c, n) => (n === 1 ? new Response("{}", { status: 413 }) : ok(goodLesson)));
  const r = await runExplain({ question: "X=10 Y=-10 oqida parabola qanday voladi", mode: "full" });
  assert.equal(r.ok, true);
  assert.equal(calls.length, 2);
  const promptTokens = Math.ceil((systemOf(calls[1]).length + calls[1].body.messages[1].content.length) / 2.8);
  assert.ok(calls[1].body.max_tokens < 5500);
  assert.ok(promptTokens + calls[1].body.max_tokens <= 8000, "input + output fits the 8K limit");
});

test("GROQ_TPM_LIMIT fits the budget from the very first request (no failing attempt)", async () => {
  process.env.GROQ_API_KEY = "k1";
  process.env.GROQ_TPM_LIMIT = "8000";
  mock(() => ok(goodLesson));
  await runExplain({ question: "Present Continuous nima?", mode: "full" });
  const input = Math.ceil((systemOf(calls[0]).length + calls[0].body.messages[1].content.length) / 2.8);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].body.max_tokens >= 4000 && calls[0].body.max_tokens < 5200, String(calls[0].body.max_tokens));
  assert.ok(input + calls[0].body.max_tokens <= 8000);

  process.env.GROQ_TPM_LIMIT = "250000"; // a paid plan: the full wish is granted
  await runExplain({ question: "Present Continuous nima?", mode: "full" });
  assert.equal(calls[1].body.max_tokens, 5200);
});

test("a reply cut off by max_tokens keeps its finished beats and the rest is requested once", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock((_c, n) => (n === 1 ? cutOff(threeAndAHalf()) : ok(lessonOf(4, 6))));
  const r = await runExplain({ question: "Present Continuous nima?", mode: "full" });
  assert.equal(r.ok, true);
  assert.equal(calls.length, 2, "no repair round trip for a cut-off reply, just one continuation");
  const lesson = (r as { lesson: { title: string; beats: { caption: string; id: string }[] } }).lesson;
  assert.deepEqual(lesson.beats.map((b) => b.caption), ["Qadam 1", "Qadam 2", "Qadam 3", "Qadam 4", "Qadam 5", "Qadam 6"]);
  assert.equal(new Set(lesson.beats.map((b) => b.id)).size, 6);
  assert.equal("notice" in r, false, "complete lesson: nothing to warn about");
  const ask = calls[1].body.messages.at(-1).content as string;
  assert.match(ask, /Qadam 1\) ?|1\) Qadam 1/);
  assert.match(ask, /Qadam 3/);
  assert.doesNotMatch(ask, /Qadam 4/, "only finished beats are listed");
  assert.match(ask, /Uzun dars/);
});

test("cut-off reply and the continuation fails: the finished beats are shown with an honest notice", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock((_c, n) => (n === 1 ? cutOff(threeAndAHalf()) : status(500)));
  const r = await runExplain({ question: "Present Continuous nima?", mode: "full" });
  assert.equal(r.ok, true);
  assert.equal((r as { lesson: { beats: unknown[] } }).lesson.beats.length, 3);
  assert.match((r as { notice?: string }).notice ?? "", /uzunligi chegaraga yetdi/);
});

test("short answers are never continued", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock(() => cutOff(threeAndAHalf()));
  const r = await runExplain({ question: "Present Continuous nima?", mode: "short" });
  assert.equal(r.ok, true);
  assert.equal(calls.length, 1);
  assert.equal("notice" in r, false);
});

test("built-in lesson shown because the AI failed: the visitor is told why", async () => {
  process.env.GROQ_API_KEY = "k1";
  mock(() => status(500));
  const down = await runExplain({ question: "Present Continuous nima?", mode: "full" });
  assert.equal(down.ok, true);
  assert.match((down as { notice?: string }).notice ?? "", /tayyor qisqa dars/);

  resetFailoverState();
  mock(() => new Response("{}", { status: 429, headers: { "retry-after": "20" } }));
  const busy = await runExplain({ question: "Present Continuous nima?", mode: "full" });
  assert.match((busy as { notice?: string }).notice ?? "", /So'rovlar ko'payib ketdi/);
});

test("no AI key: the built-in lesson comes with a notice, an AI answer comes without one", async () => {
  const noKey = await runExplain({ question: "Present Continuous nima?", mode: "full" });
  assert.equal(noKey.ok, true);
  assert.match((noKey as { notice?: string }).notice ?? "", /AI kaliti ulanmagan/);

  process.env.GROQ_API_KEY = "k1";
  mock(() => ok(goodLesson));
  const fine = await runExplain({ question: "Fotosintez nima?", mode: "full" });
  assert.equal("notice" in fine, false);
});
