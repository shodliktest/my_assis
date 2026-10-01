//#region node_modules/.nitro/vite/services/ssr/assets/lesson-DLZaaYUc.js
var DRAW_KINDS = [
	"title",
	"box",
	"text",
	"rule",
	"circle",
	"arrow",
	"check",
	"cross",
	"badge",
	"callout",
	"formula",
	"table",
	"icon",
	"number",
	"highlight",
	"chips",
	"strike"
];
var PAGE = {
	w: 720,
	h: 1480
};
var PAGE_H = {
	short: 1480,
	full: 2480
};
var SUGGESTED_QUESTIONS = [
	"Present Continuous nima?",
	"Present Simple nima?",
	"Present Simple va Continuous farqi",
	"Past Simple qanday tuziladi?"
];
var PENCIL_COLORS = [
	{
		id: "sun",
		label: "Sariq",
		body: "#E8B923",
		wood: "#E2B48A",
		lead: "#2A241C"
	},
	{
		id: "mint",
		label: "Yashil",
		body: "#3D9B7A",
		wood: "#D7B48A",
		lead: "#1F3D32"
	},
	{
		id: "coral",
		label: "Qizil",
		body: "#D45B4A",
		wood: "#E0B089",
		lead: "#3A1C18"
	},
	{
		id: "sky",
		label: "Ko'k",
		body: "#3B7CC4",
		wood: "#E2B48A",
		lead: "#1B2C44"
	},
	{
		id: "ink",
		label: "Siyoh",
		body: "#243044",
		wood: "#D9B48C",
		lead: "#111827"
	},
	{
		id: "sand",
		label: "Qum",
		body: "#C9853A",
		wood: "#E6C09A",
		lead: "#3F2A12"
	}
];
function nextPencilColor(id) {
	return PENCIL_COLORS[(PENCIL_COLORS.findIndex((c) => c.id === id) + 1) % PENCIL_COLORS.length]?.id ?? "sun";
}
function getPencilColor(id) {
	return PENCIL_COLORS.find((c) => c.id === id) ?? PENCIL_COLORS[0];
}
var ink = "#1e3a5f";
var muted = "#57534e";
var green = "#0f6b63";
var blue = "#1d4ed8";
var red = "#b42318";
var gold = "#b45309";
var paperBlue = "color-mix(in oklab, #93c5fd 28%, #fbf7ee)";
var paperGreen = "color-mix(in oklab, #6ee7b7 22%, #fbf7ee)";
var paperRed = "color-mix(in oklab, #fca5a5 24%, #fbf7ee)";
var paperGold = "color-mix(in oklab, #fcd34d 28%, #fbf7ee)";
var paperInk = "color-mix(in oklab, #93c5fd 16%, #fbf7ee)";
var CONTINUOUS_LESSON = {
	title: "Present Simple vs Continuous",
	beats: [
		{
			id: "essence",
			speech: "Present Continuous bu ayni hozir ko'z oldingizda sodir bo'layotgan jonli harakat. Uning bitta oltin qoidasi bor: to be va fe'lga ing dumi!",
			caption: "Present Continuous bu ayni hozir ko'z oldingizda sodir bo'layotgan jonli harakat. Uning bitta oltin qoidasi bor: to be va fe'lga ing dumi!",
			items: [
				{
					id: "t1",
					kind: "title",
					text: "Present Continuous (Hozirgi Davomiy)",
					x: 40,
					y: 28,
					color: blue,
					size: "xl"
				},
				{
					id: "b1",
					kind: "box",
					x: 36,
					y: 92,
					w: 648,
					h: 168,
					color: blue,
					fill: paperBlue
				},
				{
					id: "b1a",
					kind: "text",
					text: "Mohiyati: Ayni damda davom etayotgan ish-harakat",
					x: 52,
					y: 108,
					color: blue,
					size: "md"
				},
				{
					id: "b1b",
					kind: "text",
					text: "Kalit so'zlar: now (hozir), right now, at the moment",
					x: 52,
					y: 144,
					color: muted,
					size: "sm"
				},
				{
					id: "b1c",
					kind: "text",
					text: "Oltin formula: am / is / are + fe'l-ING",
					x: 52,
					y: 180,
					color: gold,
					size: "md"
				}
			]
		},
		{
			id: "positive",
			speech: "Dastlab darak shakli. Eslab qol: men uchun am, uchinchi shaxs uchun is, ko'plik va sen uchun are ishlatiladi!",
			caption: "Dastlab darak shakli. Eslab qol: men uchun am, uchinchi shaxs uchun is, ko'plik va sen uchun are ishlatiladi!",
			items: [
				{
					id: "b2",
					kind: "box",
					x: 36,
					y: 280,
					w: 648,
					h: 268,
					color: green,
					fill: paperGreen
				},
				{
					id: "b2h",
					kind: "text",
					text: "1. Darak shakli (+)",
					x: 52,
					y: 296,
					color: green,
					size: "lg"
				},
				{
					id: "b2r",
					kind: "rule",
					x: 52,
					y: 336,
					w: 616,
					color: green
				},
				{
					id: "b2a",
					kind: "text",
					text: "I + AM + verb-ing  →  I am reading a book. (Men kitob o'qiyapman.)",
					x: 52,
					y: 350,
					color: ink,
					size: "sm"
				},
				{
					id: "b2b",
					kind: "text",
					text: "He / She / It + IS + verb-ing  →  She is cooking plov. (U osh pishiryapti.)",
					x: 52,
					y: 392,
					color: ink,
					size: "sm"
				},
				{
					id: "b2c",
					kind: "text",
					text: "We / You / They + ARE + verb-ing",
					x: 52,
					y: 434,
					color: ink,
					size: "sm"
				}
			]
		},
		{
			id: "negative",
			speech: "Inkor ya'ni negativ holatda to be dan keyin shunchaki not qo'shasan. Fe'ldagi ing dumi aslo yo'qolmaydi!",
			caption: "Inkor ya'ni negativ holatda to be dan keyin shunchaki not qo'shasan. Fe'ldagi ing dumi aslo yo'qolmaydi!",
			items: [
				{
					id: "b3",
					kind: "box",
					x: 36,
					y: 568,
					w: 648,
					h: 268,
					color: red,
					fill: paperRed
				},
				{
					id: "b3h",
					kind: "text",
					text: "2. Inkor (Negativ) shakli (−)",
					x: 52,
					y: 584,
					color: red,
					size: "lg"
				},
				{
					id: "b3r",
					kind: "rule",
					x: 52,
					y: 624,
					w: 616,
					color: red
				},
				{
					id: "b3a",
					kind: "text",
					text: "Formula: am / is / are + NOT + verb-ing",
					x: 52,
					y: 640,
					color: red,
					size: "md"
				},
				{
					id: "b3b",
					kind: "text",
					text: "I am NOT sleeping. (Men uxlamayapman.)",
					x: 52,
					y: 678,
					color: ink,
					size: "sm"
				},
				{
					id: "b3c",
					kind: "text",
					text: "He IS NOT (isn't) working. (U ishlamayapti.)",
					x: 52,
					y: 712,
					color: ink,
					size: "sm"
				},
				{
					id: "b3d",
					kind: "text",
					text: "They ARE NOT (aren't) playing. (Ular o'ynamayapti.)",
					x: 52,
					y: 746,
					color: ink,
					size: "sm"
				}
			]
		},
		{
			id: "question",
			speech: "So'roq gap yasash uchun esa yordamchi to be sakrab gapning eng boshiga chiqadi. Qara, qanday oson!",
			caption: "So'roq gap yasash uchun esa yordamchi to be sakrab gapning eng boshiga chiqadi. Qara, qanday oson!",
			items: [
				{
					id: "b4",
					kind: "box",
					x: 36,
					y: 856,
					w: 648,
					h: 248,
					color: ink,
					fill: paperInk
				},
				{
					id: "b4h",
					kind: "text",
					text: "3. So'roq shakli (?)",
					x: 52,
					y: 872,
					color: ink,
					size: "lg"
				},
				{
					id: "b4r",
					kind: "rule",
					x: 52,
					y: 912,
					w: 616,
					color: ink
				},
				{
					id: "b4a",
					kind: "text",
					text: "Formula: Am / Is / Are + kim + verb-ing?",
					x: 52,
					y: 928,
					color: ink,
					size: "md"
				},
				{
					id: "b4b",
					kind: "text",
					text: "Are you listening to me? (Meni eshityapsanmi?)",
					x: 52,
					y: 966,
					color: muted,
					size: "sm"
				},
				{
					id: "b4c",
					kind: "text",
					text: "Is he watching TV? (U televizor ko'ryaptimi?)",
					x: 52,
					y: 1e3,
					color: muted,
					size: "sm"
				},
				{
					id: "b4d",
					kind: "text",
					text: "→ Yes, he is. / No, he isn't.",
					x: 52,
					y: 1034,
					color: green,
					size: "sm"
				}
			]
		},
		{
			id: "mistake",
			speech: "Ko'pchilik shu yerda adashadi: to be ni aytadi-yu, fe'lga ing qo'shishni unutib I am sleep deb qo'yadi. Ikkisi ham birga bo'lishi shart!",
			caption: "Ko'pchilik shu yerda adashadi: to be ni aytadi-yu, fe'lga ing qo'shishni unutib I am sleep deb qo'yadi. Ikkisi ham birga bo'lishi shart!",
			items: [
				{
					id: "b5",
					kind: "box",
					x: 36,
					y: 1124,
					w: 648,
					h: 220,
					color: gold,
					fill: paperGold
				},
				{
					id: "b5a",
					kind: "text",
					text: "Eng katta xato: I am work  (NOTO'G'RI)",
					x: 52,
					y: 1144,
					color: red,
					size: "md"
				},
				{
					id: "b5b",
					kind: "text",
					text: "To'g'risi: I am working.  (to be + ing doim juft!)",
					x: 52,
					y: 1184,
					color: green,
					size: "md"
				},
				{
					id: "b5c",
					kind: "text",
					text: "Sinab ko'r: «Ular hozir dars qilishmayapti» gapini inglizcha yoz!",
					x: 52,
					y: 1228,
					color: ink,
					size: "sm"
				}
			]
		}
	]
};
var SIMPLE_LESSON = {
	title: "Present Simple",
	beats: [
		{
			id: "s1",
			speech: "Present Simple — hozirgi oddiy zamon. U doimiy odatlar, umumiy haqiqatlar va muntazam harakatlarni ifodalaydi.",
			caption: "Present Simple — hozirgi oddiy zamon. U doimiy odatlar, umumiy haqiqatlar va muntazam harakatlarni ifodalaydi.",
			items: [
				{
					id: "st",
					kind: "title",
					text: "Present Simple (Oddiy Hozirgi Zamon)",
					x: 40,
					y: 28,
					color: ink,
					size: "xl"
				},
				{
					id: "sb",
					kind: "box",
					x: 36,
					y: 96,
					w: 648,
					h: 140,
					color: ink,
					fill: paperInk
				},
				{
					id: "sba",
					kind: "text",
					text: "Qachon ishlatiladi?",
					x: 52,
					y: 112,
					color: ink,
					size: "lg"
				},
				{
					id: "sbb",
					kind: "text",
					text: "1. Doimiy odatlar  ·  2. Umumiy haqiqat  ·  3. Muntazam ishlar",
					x: 52,
					y: 156,
					color: muted,
					size: "sm"
				}
			]
		},
		{
			id: "s2",
			speech: "I, you, we, they bilan fe'l odatdagi shaklda qoladi. He, she, it bilan esa fe'lga s qo'shiladi.",
			caption: "I, you, we, they bilan fe'l odatdagi shaklda qoladi. He, she, it bilan esa fe'lga s qo'shiladi.",
			items: [
				{
					id: "s2b",
					kind: "box",
					x: 36,
					y: 260,
					w: 648,
					h: 220,
					color: green,
					fill: paperGreen
				},
				{
					id: "s2h",
					kind: "text",
					text: "1. Darak shakli (+)",
					x: 52,
					y: 276,
					color: green,
					size: "lg"
				},
				{
					id: "s2a",
					kind: "text",
					text: "I / You / We / They  +  V    →  They play football.",
					x: 52,
					y: 324,
					color: ink,
					size: "sm"
				},
				{
					id: "s2c",
					kind: "text",
					text: "He / She / It  +  V-s    →  She works every day.",
					x: 52,
					y: 368,
					color: ink,
					size: "sm"
				}
			]
		},
		{
			id: "s3",
			speech: "Inkor va so'roqda yordamchi do, does ishlatiladi. Signal so'zlar: always, usually, every day, never.",
			caption: "Inkor va so'roqda yordamchi do, does ishlatiladi. Signal so'zlar: always, usually, every day, never.",
			items: [
				{
					id: "s3b",
					kind: "box",
					x: 36,
					y: 504,
					w: 648,
					h: 200,
					color: red,
					fill: paperRed
				},
				{
					id: "s3h",
					kind: "text",
					text: "2. Inkor  ·  do / does + not + V",
					x: 52,
					y: 520,
					color: red,
					size: "lg"
				},
				{
					id: "s3a",
					kind: "text",
					text: "I do not (don't) eat meat.   He does not (doesn't) play.",
					x: 52,
					y: 568,
					color: ink,
					size: "sm"
				},
				{
					id: "s3c",
					kind: "text",
					text: "So'roq: Do you live here?  Does she work?",
					x: 52,
					y: 608,
					color: muted,
					size: "sm"
				},
				{
					id: "s4b",
					kind: "box",
					x: 36,
					y: 728,
					w: 648,
					h: 120,
					color: gold,
					fill: paperGold
				},
				{
					id: "s4a",
					kind: "text",
					text: "Signal so'zlar: always · usually · often · never · every day",
					x: 52,
					y: 768,
					color: gold,
					size: "md"
				}
			]
		}
	]
};
var COMPARE_LESSON = {
	title: "Present Simple vs Continuous",
	beats: [{
		id: "c1",
		speech: "Present Simple odat va faktlar uchun. Present Continuous esa ayni damda davom etayotgan ish uchun. Ikkalasini aralashtirmang!",
		caption: "Present Simple odat va faktlar uchun. Present Continuous esa ayni damda davom etayotgan ish uchun. Ikkalasini aralashtirmang!",
		items: [
			{
				id: "ct",
				kind: "title",
				text: "Simple  vs  Continuous",
				x: 40,
				y: 28,
				color: ink,
				size: "xl"
			},
			{
				id: "cl",
				kind: "box",
				x: 36,
				y: 100,
				w: 312,
				h: 280,
				color: green,
				fill: paperGreen
			},
			{
				id: "clh",
				kind: "text",
				text: "Present Simple",
				x: 52,
				y: 118,
				color: green,
				size: "lg"
			},
			{
				id: "cla",
				kind: "text",
				text: "Odat · fakt · jadval",
				x: 52,
				y: 164,
				color: ink,
				size: "sm"
			},
			{
				id: "clb",
				kind: "text",
				text: "I drink coffee every day.",
				x: 52,
				y: 208,
				color: muted,
				size: "sm"
			},
			{
				id: "clc",
				kind: "text",
				text: "Formula: V / V-s",
				x: 52,
				y: 252,
				color: gold,
				size: "md"
			},
			{
				id: "cr",
				kind: "box",
				x: 372,
				y: 100,
				w: 312,
				h: 280,
				color: blue,
				fill: paperBlue
			},
			{
				id: "crh",
				kind: "text",
				text: "Present Continuous",
				x: 388,
				y: 118,
				color: blue,
				size: "lg"
			},
			{
				id: "cra",
				kind: "text",
				text: "Ayni hozir · jonli harakat",
				x: 388,
				y: 164,
				color: ink,
				size: "sm"
			},
			{
				id: "crb",
				kind: "text",
				text: "I am drinking coffee now.",
				x: 388,
				y: 208,
				color: muted,
				size: "sm"
			},
			{
				id: "crc",
				kind: "text",
				text: "Formula: be + V-ing",
				x: 388,
				y: 252,
				color: gold,
				size: "md"
			}
		]
	}]
};
var EMPTY_LESSON = {
	title: "Daftar",
	beats: []
};
var LOCAL_BY_HINT = [
	{
		hint: /continuous|davomiy|hozirgi davom/i,
		lesson: CONTINUOUS_LESSON
	},
	{
		hint: /farq|versus|vs\.?|solisht/i,
		lesson: COMPARE_LESSON
	},
	{
		hint: /present simple|oddiy hozirgi/i,
		lesson: SIMPLE_LESSON
	}
];
function localLessonFor(question) {
	const q = question.trim();
	for (const row of LOCAL_BY_HINT) if (row.hint.test(q)) return row.lesson;
	return null;
}
function clampCoord(n, max = 94) {
	if (!Number.isFinite(n)) return 10;
	return Math.min(max, Math.max(4, n));
}
function isHex(value) {
	return !!value && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}
function clampMaybePercent(n, pixelMax) {
	if (!Number.isFinite(n)) return 10;
	if (n > 100) return Math.min(pixelMax, Math.max(4, n));
	return clampCoord(n, 96);
}
function normalizeLesson(raw) {
	const kinds = new Set(DRAW_KINDS);
	return {
		title: raw.title.trim().slice(0, 100) || "Dars",
		beats: raw.beats.slice(0, 14).map((beat, bi) => ({
			id: beat.id || `beat-${bi}`,
			speech: beat.speech.trim().slice(0, 900),
			caption: (beat.caption || beat.speech).trim().slice(0, 900),
			items: beat.items.slice(0, 18).map((item, ii) => ({
				id: item.id || `i-${bi}-${ii}`,
				kind: kinds.has(item.kind) ? item.kind : "text",
				text: item.text?.slice(0, 220),
				x: clampMaybePercent(item.x, PAGE.w - 8),
				y: clampMaybePercent(item.y, 3200),
				w: item.w,
				h: item.h,
				x2: item.x2 == null ? void 0 : clampMaybePercent(item.x2, PAGE.w - 8),
				y2: item.y2 == null ? void 0 : clampMaybePercent(item.y2, 3200),
				color: isHex(item.color) ? item.color : "#1e3a5f",
				fill: item.fill,
				size: item.size,
				icon: item.icon?.slice(0, 24),
				rows: item.rows?.slice(0, 8).map((row) => row.slice(0, 5).map((cell) => String(cell).slice(0, 48))),
				chips: item.chips?.slice(0, 12).map((c) => String(c).slice(0, 32))
			}))
		}))
	};
}
function mapCoord(n, full) {
	if (n > 100) return n;
	return n / 100 * full;
}
/** Convert percent-based AI coords onto the notebook page. */
function toPageLesson(lesson, pageH = PAGE.h) {
	if (!lesson.beats.some((b) => b.items.some((it) => it.x <= 100 && it.y <= 100))) return lesson;
	return {
		...lesson,
		beats: lesson.beats.map((beat) => ({
			...beat,
			items: beat.items.map((item) => ({
				...item,
				x: mapCoord(item.x, PAGE.w),
				y: mapCoord(item.y, pageH),
				w: item.w == null ? item.w : item.w > 100 ? item.w : item.w / 100 * PAGE.w,
				h: item.h == null ? item.h : item.h > 100 ? item.h : item.h / 100 * pageH,
				x2: item.x2 == null ? item.x2 : mapCoord(item.x2, PAGE.w),
				y2: item.y2 == null ? item.y2 : mapCoord(item.y2, pageH)
			}))
		}))
	};
}
function lessonPageSize(lesson, fallbackH = PAGE.h) {
	let maxY = fallbackH;
	for (const beat of lesson.beats) for (const item of beat.items) {
		const extra = item.h ?? (item.kind === "icon" ? 64 : item.kind === "table" ? 120 : 44);
		const bottom = Math.max(item.y + extra, item.y2 ?? 0);
		if (bottom + 90 > maxY) maxY = bottom + 90;
	}
	return {
		w: PAGE.w,
		h: Math.min(3400, Math.max(PAGE.h, Math.ceil(maxY)))
	};
}
//#endregion
export { PENCIL_COLORS as a, lessonPageSize as c, normalizeLesson as d, toPageLesson as f, PAGE_H as i, localLessonFor as l, EMPTY_LESSON as n, SUGGESTED_QUESTIONS as o, PAGE as r, getPencilColor as s, DRAW_KINDS as t, nextPencilColor as u };
