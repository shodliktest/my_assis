import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { d as normalizeLesson, l as localLessonFor, t as DRAW_KINDS } from "./lesson-DLZaaYUc.mjs";
import { a as object, i as number, n as array, o as string, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/explain-2GO0RDzb.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var ItemSchema = object({
	id: string().optional(),
	kind: string().default("text").transform((k) => DRAW_KINDS.includes(k) ? k : "text"),
	text: string().max(220).optional(),
	x: number(),
	y: number(),
	w: number().optional(),
	h: number().optional(),
	x2: number().optional(),
	y2: number().optional(),
	color: string().optional(),
	fill: string().optional(),
	size: _enum([
		"sm",
		"md",
		"lg",
		"xl"
	]).optional(),
	icon: string().max(24).optional(),
	rows: array(array(string().max(48)).max(5)).max(8).optional(),
	chips: array(string().max(32)).max(12).optional()
});
var BeatSchema = object({
	id: string().optional(),
	speech: string().min(1).max(900),
	caption: string().max(900).optional(),
	items: array(ItemSchema).min(1).max(18)
});
var LessonSchema = object({
	title: string().min(1).max(100),
	beats: array(BeatSchema).min(1).max(14)
});
var InputSchema = object({
	question: string().min(2).max(400),
	mode: _enum(["short", "full"]).optional()
});
var GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
var GROQ_MODELS = [
	"openai/gpt-oss-120b",
	"qwen/qwen3.8-27b",
	"openai/gpt-oss-20b"
];
var HttpError = class extends Error {
	status;
	constructor(status, message) {
		super(message);
		this.status = status;
	}
};
function groqKeys() {
	const keys = [];
	const seen = /* @__PURE__ */ new Set();
	const add = (value) => {
		const t = value?.trim();
		if (!t || seen.has(t)) return;
		seen.add(t);
		keys.push(t);
	};
	add(process.env.GROQ_API_KEY);
	for (let i = 1; i <= 10; i++) add(process.env[`GROQ_API_KEY${i}`]);
	return keys;
}
function xaiProvider() {
	const xai = process.env.XAI_API_KEY?.trim();
	if (!xai) return null;
	return {
		url: "https://api.x.ai/v1/chat/completions",
		apiKey: xai,
		model: "grok-4.5"
	};
}
function friendlyApiError(status) {
	if (status === 401 || status === 403) return "AI xizmati hozircha javob bera olmayapti. Keyinroq qayta urinib ko'ring.";
	if (status === 429) return "So'rovlar ko'payib ketdi. Bir daqiqadan so'ng qayta urinib ko'ring.";
	if (status >= 500) return "Server band. Birozdan so'ng qayta urinib ko'ring.";
	return "Javob olinmadi. Birozdan so'ng qayta urinib ko'ring.";
}
function extractJson(text) {
	const trimmed = text.trim();
	const body = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim() ?? trimmed;
	const start = body.indexOf("{");
	const end = body.lastIndexOf("}");
	if (start < 0 || end <= start) throw new Error("JSON topilmadi");
	return JSON.parse(body.slice(start, end + 1));
}
function messageText(body) {
	const content = (body?.choices?.[0]?.message)?.content;
	if (typeof content === "string") return content;
	if (Array.isArray(content)) return content.map((part) => {
		if (typeof part === "string") return part;
		if (part && typeof part === "object" && "text" in part) return String(part.text ?? "");
		return "";
	}).join("");
	return "";
}
function systemPrompt(mode) {
	const visual = `Doskada IMKON QADAR KO'P vizual element ishlating. kind qiymatlari:
title, box, text, rule, circle, arrow, check, cross, badge, callout, formula, table, icon, number, highlight, chips, strike.
icon: clock,calendar,person,people,book,speech,tv,cook,sleep,work,play,warning,idea,compare,now,habit,football,coffee,write,ear,sun,repeat
chips: signal so'zlar uchun. table: rows=[["ustun","ustun"],["qator","qator"]].
formula: oltin qoida. number: 1,2,3 qadam. check/cross: to'g'ri/xato.
arrow: x,y dan x2,y2. circle: diagramma. callout: izoh pufagi. highlight: marker.
Har beatda kamida 1 ta shakl (box/circle/arrow/icon/table/formula/chips) bo'lsin.
Ranglar: sarlavha #1d4ed8, qoida #0f6b63, xato #b42318, ogohlantirish #b45309, matn #1e3a5f.
x,y,w,h FOIZDA (0-100). Yuqoridan pastga, ustma-ust tushmasin. y+h < 96.`;
	if (mode === "short") return `Siz ingliz tili grammatikasi o'qituvchisisiz. Faqat JSON qaytaring.
Til: tushuntirish o'zbekcha (lotin). Inglizcha misollar inglizcha qolsin.
Rejim: QISQA — 3-5 beat, har beatda 3-7 element. 1-3 jumla ovoz.
${visual}
JSON: {"title":"...","beats":[{"speech":"...","caption":"...","items":[{"kind":"title","text":"...","x":8,"y":6,"w":84,"color":"#1d4ed8","size":"xl"}]}]}
speech ichida inglizcha gaplar to'liq inglizcha, o'zbekcha gaplar o'zbekcha.`;
	return `Siz professional ingliz tili o'qituvchisisiz (pro teacher). Faqat JSON qaytaring.
Til: tushuntirish o'zbekcha (lotin), aniq va tushunarli. Inglizcha misollar, formulalar va gaplar INGLIZCHA qolsin.
Rejim: TO'LIQ — 8-12 beat. Har beat 5-12 vizual element. Ovoz 3-6 jumla, lekin 700 belgidan oshmasin.

Majburiy tuzilma (mavzuga moslashtiring):
1) Mohiyat + qachon ishlatiladi (icon, badge, callout)
2) Oltin formula (formula + arrow)
3) Darak (+) barcha shaxslar, jadval yoki qatorlar
4) 2-3 ta jonli misol + tarjima
5) Inkor (−) formula va misollar, check/cross
6) So'roq (?) formula, qisqa javoblar
7) Signal so'zlar (chips)
8) Keng tarqalgan xatolar (strike, noto'g'ri vs to'g'ri)
9) Qisqa mashq yoki eslatma
Zarur bo'lsa Simple vs Continuous kabi solishtirish: ikki ustun box + arrow.

Har qoida uchun kamida 2 ta aniq misol yozing (inglizcha + qavsda o'zbekcha).
${visual}
JSON: {"title":"...","beats":[{"speech":"...","caption":"...","items":[...]}]}
speech: o'zbekcha tushuntirish, ichida inglizcha misollar to'liq inglizcha gap bo'lib tursin.`;
}
async function callChat(url, apiKey, model, mode, question, extraUser) {
	const messages = [{
		role: "system",
		content: systemPrompt(mode)
	}, {
		role: "user",
		content: question
	}];
	if (extraUser) messages.push({
		role: "user",
		content: extraUser
	});
	const payload = {
		model,
		temperature: .28,
		max_tokens: mode === "full" ? 4500 : 2200,
		response_format: { type: "json_object" },
		messages
	};
	if (model.startsWith("openai/gpt-oss")) payload.reasoning_effort = "low";
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		signal: AbortSignal.timeout(mode === "full" ? 45e3 : 22e3),
		body: JSON.stringify(payload)
	});
	if (!res.ok) throw new HttpError(res.status, friendlyApiError(res.status));
	return messageText(await res.json());
}
async function callWithFailover(mode, question, extraUser) {
	const keys = groqKeys();
	let lastErr;
	for (const key of keys) {
		let skipKey = false;
		for (const model of GROQ_MODELS) try {
			return await callChat(GROQ_URL, key, model, mode, question, extraUser);
		} catch (err) {
			lastErr = err;
			const status = err instanceof HttpError ? err.status : 0;
			if (status === 429 || status === 401 || status === 403) {
				skipKey = true;
				break;
			}
			if (status === 404 || status === 400) continue;
			if (status >= 500) continue;
			if (err instanceof Error && err.name === "TimeoutError") continue;
		}
		if (!skipKey && keys.length === 1) break;
	}
	const xai = xaiProvider();
	if (xai) try {
		return await callChat(xai.url, xai.apiKey, xai.model, mode, question, extraUser);
	} catch (err) {
		lastErr = err;
	}
	if (lastErr instanceof HttpError) throw lastErr;
	if (lastErr instanceof Error && lastErr.name === "TimeoutError") throw new Error("Javob kechikdi. Qayta urinib ko'ring.");
	throw lastErr instanceof Error ? lastErr : new Error(friendlyApiError(500));
}
function toLesson(parsed) {
	const lesson = LessonSchema.parse(parsed);
	return normalizeLesson({
		title: lesson.title,
		beats: lesson.beats.map((beat, i) => ({
			id: beat.id || `beat-${i}`,
			speech: beat.speech,
			caption: beat.caption || beat.speech,
			items: beat.items.map((item, j) => ({
				id: item.id || `i-${i}-${j}`,
				kind: item.kind,
				text: item.text,
				x: item.x,
				y: item.y,
				w: item.w,
				h: item.h,
				x2: item.x2,
				y2: item.y2,
				color: item.color ?? "#1e3a5f",
				fill: item.fill,
				size: item.size,
				icon: item.icon,
				rows: item.rows,
				chips: item.chips
			}))
		}))
	});
}
var explainQuestion_createServerFn_handler = createServerRpc({
	id: "1d5fa1346c9c3a8516dd0353fcd90cc89fb4b84a35a7453941ae00665a369cdb",
	name: "explainQuestion",
	filename: "src/lib/explain.ts"
}, (opts) => explainQuestion.__executeServer(opts));
var explainQuestion = createServerFn({ method: "POST" }).validator((input) => InputSchema.parse(input)).handler(explainQuestion_createServerFn_handler, async ({ data }) => {
	const mode = data.mode === "short" ? "short" : "full";
	const local = localLessonFor(data.question);
	const hasGroq = groqKeys().length > 0;
	const hasXai = !!process.env.XAI_API_KEY?.trim();
	if (!hasGroq && !hasXai) {
		if (local) return {
			ok: true,
			lesson: local,
			mode: "short"
		};
		return {
			ok: false,
			error: "Bu savol uchun hozircha AI kaliti ulanmagan. Present Simple yoki Present Continuous ni so'rang."
		};
	}
	try {
		let rawText = await callWithFailover(mode, data.question);
		let parsed;
		try {
			parsed = extractJson(rawText);
		} catch {
			rawText = await callWithFailover(mode, data.question, "Faqat yagona JSON obyekt qaytaring. Markdown yo'q.");
			parsed = extractJson(rawText);
		}
		return {
			ok: true,
			lesson: toLesson(parsed),
			mode
		};
	} catch (err) {
		if (local) return {
			ok: true,
			lesson: local,
			mode: "short"
		};
		const known = err instanceof Error && (err.message.startsWith("AI xizmati") || err.message.startsWith("So'rovlar") || err.message.startsWith("Server") || err.message.startsWith("Javob"));
		return {
			ok: false,
			error: err instanceof Error && err.name === "TimeoutError" ? "Javob kechikdi. Qayta urinib ko'ring." : known && err instanceof Error ? err.message : "Javob olinmadi. Birozdan so'ng qayta urinib ko'ring."
		};
	}
});
//#endregion
export { explainQuestion_createServerFn_handler };
