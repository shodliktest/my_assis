import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as PENCIL_COLORS, c as lessonPageSize, f as toPageLesson, i as PAGE_H, n as EMPTY_LESSON, o as SUGGESTED_QUESTIONS, r as PAGE, s as getPencilColor, u as nextPencilColor } from "./lesson-DLZaaYUc.mjs";
import { a as object, o as string, t as _enum } from "../_libs/zod.mjs";
import { a as RotateCcw, c as Pause, d as List, f as ArrowUp, i as Share2, l as Minus, n as Volume2, o as Plus, s as Play, t as VolumeX, u as LoaderCircle } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-C3vIkddu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function wait(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
function TutorPencil({ x, y, mood, colorId, speaking, onRecolor }) {
	const palette = getPencilColor(colorId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("tutor-pencil", mood === "write" && "is-write", mood === "think" && "is-think", speaking && "is-speak"),
		style: {
			left: x,
			top: y
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "tutor-pencil-hit",
			"aria-label": "Qalam rangini o'zgartirish",
			title: "Rangini o'zgartirish",
			onClick: (event) => {
				event.stopPropagation();
				onRecolor();
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
				viewBox: "0 0 90 210",
				className: "tutor-pencil-svg",
				"aria-hidden": "true",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("defs", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("linearGradient", {
					id: "pencilShine",
					x1: "0",
					x2: "1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "0%",
							stopColor: "#fff",
							stopOpacity: "0.22"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "42%",
							stopColor: "#fff",
							stopOpacity: "0"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("stop", {
							offset: "100%",
							stopColor: "#000",
							stopOpacity: "0.12"
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("filter", {
					id: "soft",
					x: "-20%",
					y: "-20%",
					width: "140%",
					height: "140%",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("feDropShadow", {
						dx: "0",
						dy: "2",
						stdDeviation: "2.2",
						floodOpacity: "0.22"
					})
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
					filter: "url(#soft)",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "31",
							y: "6",
							width: "28",
							height: "22",
							rx: "8",
							fill: "#E7A3B0"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "34",
							y: "8",
							width: "22",
							height: "8",
							rx: "4",
							fill: "#F4C4CC"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "29",
							y: "26",
							width: "32",
							height: "18",
							rx: "3",
							fill: "#C9CDD3"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "31",
							y: "29",
							width: "28",
							height: "2.2",
							fill: "#E8EAED"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "31",
							y: "34",
							width: "28",
							height: "2.2",
							fill: "#9AA1AA"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "31",
							y: "39",
							width: "28",
							height: "2.2",
							fill: "#E8EAED"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "28",
							y: "44",
							width: "34",
							height: "108",
							rx: "8",
							fill: palette.body
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
							x: "28",
							y: "44",
							width: "34",
							height: "108",
							rx: "8",
							fill: "url(#pencilShine)"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M49 44c10 18 12 52 11 108H62V44Z",
							fill: "#111",
							opacity: "0.18"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M28 118c-11 4-18 14-14 24",
							fill: "none",
							stroke: palette.body,
							strokeWidth: "7",
							strokeLinecap: "round"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M62 120c12 6 14 22 4 32",
							fill: "none",
							stroke: palette.body,
							strokeWidth: "7",
							strokeLinecap: "round"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "38",
							cy: "58",
							r: "10",
							fill: "#1A1A1A",
							opacity: "0.16"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
							cx: "52",
							cy: "58",
							r: "10",
							fill: "#F7F1E4",
							opacity: "0.2"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							className: "pencil-face",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									cx: "39.5",
									cy: "92",
									rx: "5.2",
									ry: "5.6",
									fill: "#F7F1E4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									cx: "54.5",
									cy: "92",
									rx: "5.2",
									ry: "5.6",
									fill: "#F7F1E4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "40.4",
									cy: "93",
									r: "2.15",
									fill: "#1A1A1A"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "55.4",
									cy: "93",
									r: "2.15",
									fill: "#1A1A1A"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "41.4",
									cy: "92.2",
									r: "0.7",
									fill: "#F7F1E4"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "56.4",
									cy: "92.2",
									r: "0.7",
									fill: "#F7F1E4"
								}),
								speaking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
									className: "pencil-mouth-speak",
									cx: "47",
									cy: "106",
									rx: "5.2",
									ry: "3.4",
									fill: "#1A1A1A"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
									d: "M40 104c2.6 5.4 11.4 5.4 14 0",
									fill: "none",
									stroke: "#1A1A1A",
									strokeWidth: "2.4",
									strokeLinecap: "round"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "34",
									cy: "102",
									r: "2.1",
									fill: "#C45C4A",
									opacity: "0.55"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
									cx: "60",
									cy: "102",
									r: "2.1",
									fill: "#C45C4A",
									opacity: "0.55"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M28 152 L45 196 L62 152 Z",
							fill: palette.wood
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M34 168 L45 196 L56 168 Z",
							fill: palette.lead
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
							d: "M42 188 L45 196 L48 188 Z",
							fill: "#111"
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "draw-orb" })]
		})
	});
}
var ICONS = [
	"clock",
	"calendar",
	"person",
	"people",
	"book",
	"speech",
	"tv",
	"cook",
	"sleep",
	"work",
	"play",
	"warning",
	"idea",
	"compare",
	"now",
	"habit",
	"football",
	"coffee",
	"write",
	"ear",
	"sun",
	"repeat"
];
function isPictogramId(value) {
	return !!value && ICONS.includes(value);
}
function BoardPictogram({ id, color, size = 52 }) {
	const name = isPictogramId(id) ? id : "idea";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 64 64",
		width: size,
		height: size,
		fill: "none",
		stroke: color,
		strokeWidth: "2.4",
		strokeLinecap: "round",
		strokeLinejoin: "round",
		"aria-hidden": "true",
		children: shape(name, color)
	});
}
function shape(id, color) {
	switch (id) {
		case "clock": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "32",
			cy: "32",
			r: "18"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M32 20v13l9 5" })] });
		case "calendar": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "12",
				y: "16",
				width: "40",
				height: "34",
				rx: "4"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 26h40M22 12v10M42 12v10" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M22 36h6M32 36h6M42 36h.01M22 44h6M32 44h6" })
		] });
		case "person": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "32",
			cy: "20",
			r: "8"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M16 50c2-12 10-16 16-16s14 4 16 16" })] });
		case "people": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "22",
				cy: "22",
				r: "6"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10 48c1-10 7-14 12-14s11 4 12 14" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "42",
				cy: "20",
				r: "6"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M32 48c1-10 7-14 12-14s11 4 12 14" })
		] });
		case "book": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 16h18c6 0 8 4 8 4s2-4 8-4h6v34h-6c-6 0-8 4-8 4s-2-4-8-4H12V16z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M32 16v34" })] });
		case "speech": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "12",
			y: "14",
			width: "40",
			height: "26",
			rx: "8"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M24 40 18 52 34 40" })] });
		case "tv": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "10",
			y: "18",
			width: "44",
			height: "28",
			rx: "4"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M24 52h16M32 18 22 10M32 18l10-8" })] });
		case "cook": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14 34h36c0 12-8 18-18 18s-18-6-18-18z" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M20 34c0-8 4-14 12-14s12 6 12 14" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M50 28h6" })
		] });
		case "sleep": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 46c4-16 36-16 40 0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "24",
				cy: "28",
				r: "6"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M38 18h10l-10 8h10" })
		] });
		case "work": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "10",
			y: "24",
			width: "44",
			height: "26",
			rx: "3"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M24 24v-4a8 8 0 0 1 16 0v4" })] });
		case "play": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "32",
			cy: "32",
			r: "18"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M27 22v20l16-10z",
			fill: color,
			stroke: "none"
		})] });
		case "warning": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M32 10 54 50H10L32 10z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M32 26v12M32 44h.01" })] });
		case "idea": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "32",
			cy: "28",
			r: "14"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M26 42h12M28 48h8M32 42v6" })] });
		case "compare": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "8",
				y: "16",
				width: "20",
				height: "32",
				rx: "3"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "36",
				y: "16",
				width: "20",
				height: "32",
				rx: "3"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M30 32h4" })
		] });
		case "now": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "32",
				cy: "32",
				r: "18"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M32 18v14l10 6" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M46 14l6 2-2 6" })
		] });
		case "habit": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M16 32a16 16 0 1 1 4 11" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M16 44V32h12" })] });
		case "football": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "32",
			cy: "32",
			r: "16"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M32 16v32M18 24h28M18 40h28" })] });
		case "coffee": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M16 24h26v16a10 10 0 0 1-10 10h-6a10 10 0 0 1-10-10V24z" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M42 28h6a6 6 0 0 1 0 12h-6" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M22 14c2 3 2 5 0 8M30 14c2 3 2 5 0 8" })
		] });
		case "write": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14 50 40 24l8 8-26 26H14v-8z" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M36 28l8 8" })] });
		case "ear": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M40 18c8 4 10 22 0 28-6 4-12 2-14-4 0-8 8-8 8-14 0-6-4-8-8-6" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M32 32c0 4-2 6-5 6" })] });
		case "sun": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "32",
			cy: "32",
			r: "10"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M32 12v6M32 46v6M12 32h6M46 32h6M18 18l4 4M42 42l4 4M18 46l4-4M42 22l4-4" })] });
		case "repeat": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18 28V18h10" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M18 18c8-6 28-4 32 12M46 36v10H36" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M46 46c-8 6-28 4-32-12" })
		] });
		default: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "32",
			cy: "32",
			r: "14"
		});
	}
}
function fontSize(size) {
	if (size === "xl") return 34;
	if (size === "lg") return 26;
	if (size === "sm") return 18;
	return 22;
}
function BoxStroke({ item, progress }) {
	const w = item.w ?? 200;
	const h = item.h ?? 80;
	const r = 12;
	const path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		className: "pointer-events-none absolute",
		style: {
			left: item.x,
			top: item.y,
			width: w,
			height: h
		},
		viewBox: `0 0 ${w} ${h}`,
		fill: "none",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: path,
			stroke: item.color,
			strokeWidth: 2.4,
			strokeLinecap: "round",
			strokeLinejoin: "round",
			pathLength: 1,
			strokeDasharray: 1,
			strokeDashoffset: 1 - progress
		})
	});
}
function TextReveal({ item, drawing, progress, className }) {
	const reveal = drawing ? Math.max(8, progress * 100) : 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: cn("board-item absolute font-hand leading-snug", className),
		style: {
			left: item.x,
			top: item.y,
			width: item.w ?? 640,
			color: item.color,
			fontSize: fontSize(item.size),
			clipPath: `inset(0 ${100 - reveal}% 0 0)`
		},
		children: item.text
	});
}
function BoardItemView({ item, drawing, progress }) {
	const p = Math.max(0, Math.min(1, progress));
	if (item.kind === "box") {
		const w = item.w ?? 200;
		const h = item.h ?? 80;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "board-item absolute rounded-[12px]",
			style: {
				left: item.x,
				top: item.y,
				width: w,
				height: h,
				background: item.fill ?? "transparent",
				opacity: Math.min(1, p * 1.4),
				boxShadow: "var(--shadow-border)"
			}
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoxStroke, {
			item,
			progress: p
		})] });
	}
	if (item.kind === "highlight") {
		const w = item.w ?? 180;
		const h = item.h ?? 28;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute origin-left rounded-sm",
			style: {
				left: item.x,
				top: item.y,
				width: w,
				height: h,
				background: item.fill ?? item.color,
				opacity: .45 * p,
				transform: `scaleX(${p})`
			}
		});
	}
	if (item.kind === "rule" || item.kind === "strike") {
		const w = item.w ?? 200;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute origin-left",
			style: {
				left: item.x,
				top: item.y,
				width: w,
				height: item.kind === "strike" ? 3 : 1,
				background: item.color,
				opacity: item.kind === "strike" ? .85 : .45,
				transform: `scaleX(${p}) rotate(${item.kind === "strike" ? -2 : 0}deg)`
			}
		});
	}
	if (item.kind === "circle") {
		const w = item.w ?? 64;
		const h = item.h ?? w;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			className: "pointer-events-none absolute",
			style: {
				left: item.x,
				top: item.y,
				width: w,
				height: h
			},
			viewBox: `0 0 ${w} ${h}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ellipse", {
				cx: w / 2,
				cy: h / 2,
				rx: w / 2 - 2,
				ry: h / 2 - 2,
				fill: item.fill ?? "transparent",
				stroke: item.color,
				strokeWidth: 2.6,
				pathLength: 1,
				strokeDasharray: 1,
				strokeDashoffset: 1 - p
			}), item.text ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: "50%",
				y: "54%",
				textAnchor: "middle",
				fill: item.color,
				fontSize: Math.min(22, h * .38),
				fontFamily: "Caveat, cursive",
				opacity: p,
				children: item.text
			}) : null]
		});
	}
	if (item.kind === "arrow") {
		const x2 = item.x2 ?? item.x + (item.w ?? 80);
		const y2 = item.y2 ?? item.y;
		const minX = Math.min(item.x, x2) - 8;
		const minY = Math.min(item.y, y2) - 8;
		const w = Math.abs(x2 - item.x) + 16;
		const h = Math.abs(y2 - item.y) + 16;
		const x1 = item.x - minX;
		const y1 = item.y - minY;
		const dx = x2 - minX;
		const dy = y2 - minY;
		const angle = Math.atan2(dy - y1, dx - x1);
		const ah = 10;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			className: "pointer-events-none absolute",
			style: {
				left: minX,
				top: minY,
				width: w,
				height: h
			},
			viewBox: `0 0 ${w} ${h}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
				x1,
				y1,
				x2: dx,
				y2: dy,
				stroke: item.color,
				strokeWidth: 2.6,
				strokeLinecap: "round",
				pathLength: 1,
				strokeDasharray: 1,
				strokeDashoffset: 1 - p
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
				points: `${dx},${dy} ${dx - ah * Math.cos(angle - .45)},${dy - ah * Math.sin(angle - .45)} ${dx - ah * Math.cos(angle + .45)},${dy - ah * Math.sin(angle + .45)}`,
				fill: item.color,
				opacity: p
			})]
		});
	}
	if (item.kind === "check" || item.kind === "cross") {
		const s = item.w ?? 36;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			className: "pointer-events-none absolute",
			style: {
				left: item.x,
				top: item.y,
				width: s,
				height: s
			},
			viewBox: "0 0 36 36",
			fill: "none",
			children: item.kind === "check" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M6 19 L14 27 L30 9",
				stroke: item.color,
				strokeWidth: "3.4",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				pathLength: 1,
				strokeDasharray: 1,
				strokeDashoffset: 1 - p
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M8 8 L28 28",
				stroke: item.color,
				strokeWidth: "3.2",
				strokeLinecap: "round",
				pathLength: 1,
				strokeDasharray: 1,
				strokeDashoffset: 1 - p
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: "M28 8 L8 28",
				stroke: item.color,
				strokeWidth: "3.2",
				strokeLinecap: "round",
				pathLength: 1,
				strokeDasharray: 1,
				strokeDashoffset: 1 - p
			})] })
		});
	}
	if (item.kind === "number") {
		const s = item.w ?? 40;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute grid place-items-center rounded-full font-hand font-semibold",
			style: {
				left: item.x,
				top: item.y,
				width: s,
				height: s,
				background: item.fill ?? item.color,
				color: "var(--color-paper)",
				fontSize: s * .48,
				transform: `scale(${.7 + .3 * p})`,
				opacity: p
			},
			children: item.text ?? "1"
		});
	}
	if (item.kind === "badge") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute inline-flex items-center rounded-full px-3 py-1 font-hand text-lg leading-none",
		style: {
			left: item.x,
			top: item.y,
			color: item.color,
			background: item.fill ?? "color-mix(in oklab, #93c5fd 26%, #fbf7ee)",
			opacity: p,
			transform: `scale(${.86 + .14 * p})`,
			boxShadow: "var(--shadow-border)"
		},
		children: item.text
	});
	if (item.kind === "chips") {
		const chips = item.chips?.length ? item.chips : item.text ? item.text.split("·").map((s) => s.trim()) : [];
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute flex flex-wrap gap-1.5",
			style: {
				left: item.x,
				top: item.y,
				width: item.w ?? 620,
				opacity: p
			},
			children: chips.map((chip) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rounded-full px-2.5 py-1 font-hand text-[17px] leading-none",
				style: {
					color: item.color,
					background: item.fill ?? "color-mix(in oklab, #fcd34d 30%, #fbf7ee)",
					boxShadow: "var(--shadow-border)"
				},
				children: chip
			}, chip))
		});
	}
	if (item.kind === "formula") {
		const w = item.w ?? 620;
		const h = item.h ?? 64;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute grid place-items-center rounded-xl px-3 font-hand font-semibold",
			style: {
				left: item.x,
				top: item.y,
				width: w,
				height: h,
				color: item.color,
				background: item.fill ?? "color-mix(in oklab, #fcd34d 32%, #fbf7ee)",
				fontSize: fontSize(item.size ?? "lg"),
				opacity: p,
				boxShadow: "var(--shadow-border)"
			},
			children: item.text
		});
	}
	if (item.kind === "callout") {
		const w = item.w ?? 280;
		const h = item.h ?? 90;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute rounded-2xl px-3 py-2 font-hand leading-snug",
			style: {
				left: item.x,
				top: item.y,
				width: w,
				minHeight: h,
				color: item.color,
				background: item.fill ?? "color-mix(in oklab, #93c5fd 24%, #fbf7ee)",
				fontSize: fontSize(item.size ?? "sm"),
				opacity: p,
				boxShadow: "var(--shadow-border)"
			},
			children: item.text
		});
	}
	if (item.kind === "table") {
		const w = item.w ?? 620;
		const rows = item.rows?.length ? item.rows : (item.text ?? "").split("|").map((row) => row.split(",").map((c) => c.trim())).filter((r) => r.length && r[0]);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute overflow-hidden rounded-xl",
			style: {
				left: item.x,
				top: item.y,
				width: w,
				opacity: p,
				boxShadow: "var(--shadow-border)",
				background: item.fill ?? "color-mix(in oklab, #93c5fd 12%, #fbf7ee)"
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
				className: "w-full border-collapse font-hand",
				style: {
					color: item.color,
					fontSize: 18
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((row, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
					className: i === 0 ? "font-semibold" : void 0,
					children: row.map((cell, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "border px-2 py-1.5",
						style: { borderColor: "color-mix(in oklab, currentColor 28%, transparent)" },
						children: cell
					}, j))
				}, i)) })
			})
		});
	}
	if (item.kind === "icon") {
		const s = item.w ?? 56;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute",
			style: {
				left: item.x,
				top: item.y,
				width: s,
				height: s,
				opacity: p
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardPictogram, {
				id: item.icon ?? "idea",
				color: item.color,
				size: s
			})
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TextReveal, {
		item,
		drawing,
		progress: p,
		className: item.kind === "title" ? "font-semibold tracking-tight" : void 0
	});
}
function NotebookBoard({ items, drawingId, drawProgress, character, mood, speaking, colorId, onRecolor, planning, empty, page = PAGE }) {
	const scrollerRef = (0, import_react.useRef)(null);
	const [zoom, setZoom] = (0, import_react.useState)(1);
	const pinchRef = (0, import_react.useRef)(null);
	const clampZoom = (0, import_react.useCallback)((value) => {
		return Math.min(2.4, Math.max(.55, value));
	}, []);
	(0, import_react.useEffect)(() => {
		const el = scrollerRef.current;
		if (!el) return;
		setZoom(clampZoom(Math.min(el.clientWidth / page.w, el.clientHeight / page.h)));
	}, [
		clampZoom,
		page.w,
		page.h
	]);
	function onWheel(event) {
		if (!event.ctrlKey && !event.metaKey) return;
		event.preventDefault();
		const delta = event.deltaY > 0 ? .92 : 1.08;
		setZoom((z) => clampZoom(z * delta));
	}
	function onTouchStart(event) {
		if (event.touches.length === 2) {
			const [a, b] = [event.touches[0], event.touches[1]];
			const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
			pinchRef.current = {
				dist,
				zoom
			};
		}
	}
	function onTouchMove(event) {
		if (event.touches.length !== 2 || !pinchRef.current) return;
		event.preventDefault();
		const [a, b] = [event.touches[0], event.touches[1]];
		const ratio = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / pinchRef.current.dist;
		setZoom(clampZoom(pinchRef.current.zoom * ratio));
	}
	function onTouchEnd() {
		pinchRef.current = null;
	}
	const drawn = items.filter((item) => item.id !== drawingId);
	const current = items.find((item) => item.id === drawingId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "relative flex min-h-0 min-w-0 flex-1 flex-col",
		"aria-label": "O'quv daftari",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "zoom-dock",
			role: "group",
			"aria-label": "Daftarni kattalashtirish",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Kichiklashtirish",
					onClick: () => setZoom((z) => clampZoom(z / 1.15)),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "tabular-nums",
					children: [Math.round(zoom * 100), "%"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Kattalashtirish",
					onClick: () => setZoom((z) => clampZoom(z * 1.15)),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Moslashtirish",
					onClick: () => {
						const el = scrollerRef.current;
						if (!el) return;
						setZoom(clampZoom(Math.min(el.clientWidth / page.w, el.clientHeight / page.h)));
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: scrollerRef,
			className: "notebook-scroll relative min-h-0 flex-1 overflow-auto",
			onWheel,
			onTouchStart,
			onTouchMove,
			onTouchEnd,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "notebook-page relative",
				style: {
					width: page.w * zoom,
					height: page.h * zoom
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "notebook-inner absolute left-0 top-0 origin-top-left",
					style: {
						width: page.w,
						height: page.h,
						transform: `scale(${zoom})`
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "notebook-gutter pointer-events-none absolute inset-y-0 left-0 w-12" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-y-0 left-12 w-px bg-margin/70" }),
						Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "pointer-events-none absolute left-3.5 size-3 rounded-full bg-border shadow-[inset_0_1px_2px_rgba(28,25,23,0.18)]",
							style: { top: 80 + i * 240 }
						}, i)),
						planning ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute inset-0 grid place-items-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-hand text-3xl text-muted",
								children: "Doskani rejalashtiryapman…"
							})
						}) : null,
						empty && !planning ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "absolute inset-x-16 top-36 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-hand text-4xl text-muted",
								children: "Savolingizni yozing…"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 font-hand text-2xl text-muted/80",
								children: "Qalam faqat so‘ragan narsangizni doskada tushuntiradi"
							})]
						}) : null,
						drawn.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardItemView, {
							item,
							drawing: false,
							progress: 1
						}, item.id)),
						current ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BoardItemView, {
							item: current,
							drawing: true,
							progress: drawProgress
						}, current.id) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TutorPencil, {
							x: character.x,
							y: character.y,
							mood,
							colorId,
							speaking,
							onRecolor
						})
					]
				})
			})
		})]
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,box-shadow,opacity,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 disabled:pointer-events-none disabled:opacity-50 active:not-disabled:scale-[0.96] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:opacity-90",
			secondary: "bg-surface text-fg shadow-[var(--shadow-border)] hover:bg-paper",
			ghost: "text-fg hover:bg-fg/6",
			ink: "bg-ink text-ink-foreground hover:opacity-90",
			outline: "bg-transparent text-fg shadow-[var(--shadow-border)] hover:bg-fg/4"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 rounded-md px-3 text-xs",
			icon: "size-11",
			chip: "h-9 rounded-full px-3.5 text-xs font-medium"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		"data-slot": "button",
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		...props
	});
}
function PlayerBar({ title, step, total, playing, voiceOn, caption, loading, empty, onTogglePlay, onReplay, onToggleVoice, onShare, onOpenSteps, onSend }) {
	const inputRef = (0, import_react.useRef)(null);
	const ratio = total === 0 ? 0 : Math.min(1, step / total);
	function submit(event) {
		event.preventDefault();
		const form = event.currentTarget;
		const value = String(new FormData(form).get("question") ?? "").trim();
		if (!value || loading) return;
		onSend(value);
		form.reset();
		if (inputRef.current) {
			inputRef.current.style.height = "auto";
			inputRef.current.focus();
		}
	}
	function onKeyDown(event) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			event.currentTarget.form?.requestSubmit();
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "player-wrap",
		children: [caption ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "caption-bubble",
			role: "status",
			children: caption
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "player-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-4 pt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3 text-xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "min-w-0 truncate font-medium text-fg",
							children: title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "shrink-0 tabular-nums",
							children: [
								step,
								" / ",
								total || 1
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 h-1.5 overflow-hidden rounded-full bg-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-full rounded-full bg-primary transition-[width] duration-300",
							style: { width: `${ratio * 100}%` }
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-1 px-2 py-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "icon",
							"aria-label": "Qadamlar",
							onClick: onOpenSteps,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "icon",
							"aria-label": "Qayta o'ynash",
							onClick: onReplay,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "icon",
							className: "size-14 rounded-full",
							"aria-label": playing ? "Pauza" : "Davom ettirish",
							onClick: onTogglePlay,
							children: playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "icon",
							"aria-pressed": voiceOn,
							"aria-label": voiceOn ? "Ovozni o'chirish" : "Ovozni yoqish",
							onClick: onToggleVoice,
							children: voiceOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, {}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "ghost",
							size: "icon",
							"aria-label": "Ulashish",
							onClick: onShare,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {})
						})
					]
				}),
				empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1.5 px-3 pb-2",
					children: SUGGESTED_QUESTIONS.map((q) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: loading,
						className: "rounded-full bg-paper px-3 py-1.5 text-xs text-fg shadow-[var(--shadow-border)]",
						onClick: () => onSend(q),
						children: q
					}, q))
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: submit,
					className: "border-t border-border p-2.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "sr-only",
						htmlFor: "question",
						children: "Savolingizni yozing"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-end gap-2 rounded-2xl bg-paper px-3 py-1.5 shadow-[var(--shadow-border)]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							ref: inputRef,
							id: "question",
							name: "question",
							rows: 1,
							placeholder: "Savolingizni yozing...",
							disabled: loading,
							onKeyDown,
							onInput: (event) => {
								const el = event.currentTarget;
								el.style.height = "auto";
								el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
							},
							className: "max-h-24 min-h-11 w-full resize-none bg-transparent py-2.5 text-sm leading-relaxed outline-none placeholder:text-muted"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "submit",
							size: "icon",
							disabled: loading,
							className: "size-11 shrink-0 rounded-xl",
							"aria-label": "Yuborish",
							children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, { className: "size-4" })
						})]
					})]
				})
			]
		})]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var InputSchema = object({
	question: string().min(2).max(400),
	mode: _enum(["short", "full"]).optional()
});
var explainQuestion = createServerFn({ method: "POST" }).validator((input) => InputSchema.parse(input)).handler(createSsrRpc("1d5fa1346c9c3a8516dd0353fcd90cc89fb4b84a35a7453941ae00665a369cdb"));
var EN_WORDS = new Set([
	"i",
	"you",
	"he",
	"she",
	"it",
	"we",
	"they",
	"me",
	"my",
	"your",
	"his",
	"her",
	"our",
	"their",
	"am",
	"is",
	"are",
	"was",
	"were",
	"be",
	"been",
	"being",
	"do",
	"does",
	"did",
	"done",
	"have",
	"has",
	"had",
	"will",
	"would",
	"can",
	"could",
	"shall",
	"should",
	"may",
	"might",
	"must",
	"the",
	"a",
	"an",
	"to",
	"of",
	"in",
	"on",
	"at",
	"for",
	"with",
	"from",
	"by",
	"as",
	"and",
	"or",
	"but",
	"not",
	"no",
	"yes",
	"this",
	"that",
	"these",
	"those",
	"now",
	"then",
	"here",
	"there",
	"what",
	"when",
	"where",
	"who",
	"why",
	"how",
	"if",
	"so",
	"too",
	"very",
	"just",
	"only",
	"also",
	"about",
	"into",
	"over",
	"after",
	"before",
	"every",
	"each",
	"some",
	"any",
	"all",
	"day",
	"week",
	"month",
	"year",
	"time",
	"moment",
	"right",
	"always",
	"usually",
	"often",
	"sometimes",
	"never",
	"already",
	"yet",
	"still",
	"today",
	"tonight",
	"tomorrow",
	"yesterday",
	"present",
	"past",
	"future",
	"simple",
	"continuous",
	"progressive",
	"perfect",
	"passive",
	"active",
	"tense",
	"verb",
	"noun",
	"adjective",
	"adverb",
	"subject",
	"object",
	"article",
	"formula",
	"ing",
	"ed",
	"don't",
	"doesn't",
	"isn't",
	"aren't",
	"wasn't",
	"weren't",
	"haven't",
	"hasn't",
	"won't",
	"can't",
	"reading",
	"writing",
	"playing",
	"working",
	"cooking",
	"watching",
	"listening",
	"sleeping",
	"going",
	"coming",
	"doing",
	"making",
	"taking",
	"eating",
	"drinking",
	"living",
	"study",
	"studies",
	"studying",
	"play",
	"plays",
	"work",
	"works",
	"live",
	"lives",
	"go",
	"goes",
	"eat",
	"eats",
	"drink",
	"drinks",
	"watch",
	"watches",
	"read",
	"reads",
	"write",
	"writes",
	"sleep",
	"book",
	"tv",
	"football",
	"coffee",
	"tea",
	"home",
	"school",
	"english",
	"grammar",
	"example",
	"question",
	"answer",
	"positive",
	"negative",
	"while",
	"during",
	"currently",
	"look",
	"looks",
	"looking",
	"listen",
	"listens",
	"speak",
	"speaks",
	"speaking",
	"learn",
	"learns",
	"learning",
	"use",
	"uses",
	"used",
	"using",
	"form",
	"forms",
	"sentence",
	"word",
	"words",
	"signal",
	"keywords",
	"key",
	"plus",
	"minus"
].map((w) => w.toLowerCase()));
var UZ_WORDS = new Set([
	"va",
	"bu",
	"yu",
	"ham",
	"uchun",
	"bilan",
	"yoki",
	"lekin",
	"agar",
	"deb",
	"edi",
	"ekan",
	"nima",
	"qanday",
	"qachon",
	"qayerda",
	"qayer",
	"men",
	"sen",
	"u",
	"biz",
	"siz",
	"ular",
	"shu",
	"endi",
	"hozir",
	"doim",
	"odatda",
	"har",
	"emas",
	"yo'q",
	"ha",
	"kerak",
	"mumkin",
	"demak",
	"masalan",
	"ya'ni",
	"yani",
	"chunki",
	"qoida",
	"shakl",
	"darak",
	"inkor",
	"so'roq",
	"soroq",
	"zamon",
	"odat",
	"harakat",
	"misol",
	"misollar",
	"xato",
	"to'g'ri",
	"togri",
	"noto'g'ri",
	"notogri",
	"eslab",
	"qol",
	"qara",
	"oson",
	"oltin",
	"kalit",
	"so'zlar",
	"sozlar",
	"gap",
	"gaplar",
	"fe'l",
	"fel",
	"yordamchi",
	"ishlatiladi",
	"ifodalaydi",
	"tuziladi",
	"qo'shiladi",
	"qoshiladi",
	"ayni",
	"damda",
	"davom",
	"etayotgan",
	"bo'layotgan",
	"bolayotgan",
	"o'qiyapman",
	"oqiyapman",
	"kitob",
	"dars",
	"daftar",
	"o'quvchi",
	"o'qituvchi",
	"ingliz",
	"o'zbek",
	"ozbek",
	"tili",
	"grammatikasi",
	"farqi",
	"farq",
	"formulasi",
	"shunchaki",
	"aslo",
	"yo'qolmaydi",
	"sakrab",
	"boshiga",
	"chiqadi",
	"ko'pchilik",
	"adashadi",
	"unutib",
	"ikkisi",
	"birga",
	"bo'lishi",
	"shart",
	"sinab",
	"ko'r",
	"yoz",
	"tushuntiraman",
	"qarang",
	"esda",
	"tut",
	"mana",
	"quyidagi",
	"kabi",
	"bo'ladi",
	"qiladi",
	"qilish",
	"ish",
	"hali",
	"allaqachon",
	"hech",
	"muntazam",
	"umumiy",
	"haqiqat",
	"fakt",
	"jadval",
	"odatlar",
	"jonli",
	"ko'z",
	"oldingizda",
	"sodir"
].map((w) => w.toLowerCase()));
var EN_MORPH = /(?:ing|ed|tion|ness|ment|ous|ive|able|ible|ful|less|ly|ers?|est|n't|ies)$/i;
function stripWord(raw) {
	return raw.replace(/^[^A-Za-zÀ-ÿOʻGʻoʻgʻʻʼ'’-]+|[^A-Za-zÀ-ÿOʻGʻoʻgʻʻʼ'’-]+$/g, "");
}
function classifyWord(raw) {
	const stripped = stripWord(raw);
	if (!stripped) return "skip";
	const lower = stripped.toLowerCase();
	if (UZ_WORDS.has(lower) || /[ʻʼ‘’]/.test(stripped) || /[oOgG]['ʻ’]/.test(stripped)) return "uz";
	if (EN_WORDS.has(lower) || EN_MORPH.test(lower)) return "en";
	if (/^[A-Z][a-zA-Z'-]+$/.test(stripped) && stripped.length > 2) return "en";
	if (/^[A-Za-z][A-Za-z'-]*$/.test(stripped) && stripped.length >= 5 && !/[qQ]/.test(stripped)) return "en";
	return "uz";
}
function mergeParts(parts) {
	const out = [];
	for (const part of parts) {
		const text = part.text.replace(/\s+/g, " ").trim();
		if (!text) continue;
		const last = out[out.length - 1];
		if (last && last.lang === part.lang) last.text = `${last.text} ${text}`.replace(/\s+/g, " ");
		else out.push({
			lang: part.lang,
			text
		});
	}
	return out.length ? out : [{
		lang: "uz",
		text: parts.map((p) => p.text).join(" ").trim()
	}];
}
/** Split mixed Uzbek/English teacher speech into TTS-friendly runs. */
function splitSpeechByLang(text) {
	const src = text.replace(/\s+/g, " ").trim();
	if (!src) return [];
	if (src.includes("[[")) {
		const parts = [];
		const re = /\[\[(uz|en)\]\]([\s\S]*?)\[\[\/\1\]\]/gi;
		let last = 0;
		let m;
		while (m = re.exec(src)) {
			const before = src.slice(last, m.index).trim();
			if (before) parts.push(...splitUntagged(before));
			const inner = m[2]?.trim();
			if (inner) parts.push({
				lang: m[1].toLowerCase(),
				text: inner
			});
			last = m.index + m[0].length;
		}
		const tail = src.slice(last).trim();
		if (tail) parts.push(...splitUntagged(tail));
		return mergeParts(parts);
	}
	return mergeParts(splitUntagged(src));
}
function splitUntagged(src) {
	const tokens = src.split(/(\s+)/);
	const parts = [];
	let current = "uz";
	let buf = "";
	const flush = () => {
		if (!buf) return;
		parts.push({
			lang: current,
			text: buf
		});
		buf = "";
	};
	for (const token of tokens) {
		if (/^\s+$/.test(token)) {
			buf += token;
			continue;
		}
		const lang = classifyWord(token);
		if (lang === "skip") {
			buf += token;
			continue;
		}
		if (!buf) {
			current = lang;
			buf = token;
			continue;
		}
		if (lang !== current) {
			flush();
			current = lang;
			buf = token;
		} else buf += token;
	}
	flush();
	return parts;
}
var current = null;
var seq = 0;
var speakingCb = null;
var UZ_VOICE = "uz-UZ-MadinaNeural";
var EN_VOICE = "en-US-JennyNeural";
function stopSpeech() {
	seq += 1;
	speakingCb?.(false);
	speakingCb = null;
	if (current) {
		current.pause();
		current.src = "";
		current = null;
	}
	if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
}
function voiceFor(lang) {
	return lang === "en" ? EN_VOICE : UZ_VOICE;
}
async function playBuffer(buf, signal, my) {
	if (signal.aborted || my !== seq) return;
	const blob = new Blob([buf], { type: "audio/mpeg" });
	const url = URL.createObjectURL(blob);
	await new Promise((resolve, reject) => {
		if (signal.aborted || my !== seq) {
			URL.revokeObjectURL(url);
			resolve();
			return;
		}
		const audio = new Audio(url);
		current = audio;
		audio.setAttribute("playsinline", "true");
		audio.onplaying = () => {
			if (my === seq) speakingCb?.(true);
		};
		audio.onpause = () => {
			if (current === audio) speakingCb?.(false);
		};
		audio.onended = () => {
			URL.revokeObjectURL(url);
			if (current === audio) current = null;
			speakingCb?.(false);
			resolve();
		};
		audio.onerror = () => {
			URL.revokeObjectURL(url);
			if (current === audio) current = null;
			speakingCb?.(false);
			reject(/* @__PURE__ */ new Error("audio error"));
		};
		audio.play().catch(reject);
	});
}
async function speakMicrosoft(parts, signal, my) {
	const res = await fetch("/api/tts", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ parts: parts.map((p) => ({
			text: p.text,
			lang: p.lang,
			voice: voiceFor(p.lang)
		})) }),
		signal
	});
	if (!res.ok) throw new Error(`tts ${res.status}`);
	await playBuffer(await res.arrayBuffer(), signal, my);
}
function pickVoice(voices, lang) {
	const rank = (v) => {
		const code = v.lang.toLowerCase();
		const name = v.name.toLowerCase();
		if (lang === "uz") {
			if (code.startsWith("uz")) return 0;
			if (name.includes("uzbek")) return 1;
			if (code.startsWith("tr")) return 2;
			return 8;
		}
		if (code.startsWith("en-us")) return 0;
		if (code.startsWith("en")) return 1;
		if (name.includes("english")) return 2;
		return 8;
	};
	return [...voices].sort((a, b) => rank(a) - rank(b))[0] ?? null;
}
function speakBrowserPart(text, lang, my) {
	if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve();
	return new Promise((resolve) => {
		const utter = new SpeechSynthesisUtterance(text);
		utter.lang = lang === "en" ? "en-US" : "uz-UZ";
		utter.rate = lang === "en" ? .96 : .92;
		utter.pitch = 1;
		const voice = pickVoice(window.speechSynthesis.getVoices(), lang);
		if (voice) utter.voice = voice;
		utter.onstart = () => {
			if (my === seq) speakingCb?.(true);
		};
		utter.onend = () => {
			speakingCb?.(false);
			resolve();
		};
		utter.onerror = () => {
			speakingCb?.(false);
			resolve();
		};
		window.speechSynthesis.speak(utter);
	});
}
async function speakBrowser(parts, my) {
	if (typeof window === "undefined" || !window.speechSynthesis) return;
	window.speechSynthesis.cancel();
	for (const part of parts) {
		if (my !== seq) return;
		await speakBrowserPart(part.text, part.lang, my);
	}
}
async function speakText(text, opts) {
	const trimmed = text.trim();
	if (!trimmed) return;
	const my = ++seq;
	speakingCb = opts?.onSpeaking ?? null;
	speakingCb?.(false);
	const parts = splitSpeechByLang(trimmed);
	const ac = new AbortController();
	try {
		await speakMicrosoft(parts, ac.signal, my);
	} catch {
		if (my !== seq) return;
		await speakBrowser(parts, my);
	} finally {
		if (my === seq) speakingCb?.(false);
	}
}
function estimateSpeechMs(text) {
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	return Math.min(28e3, Math.max(2200, words * 380));
}
var COLOR_KEY = "daftar-pencil-color";
var MODE_KEY = "daftar-answer-mode";
function itemDuration(item) {
	if (item.kind === "box" || item.kind === "formula" || item.kind === "callout") return 900;
	if (item.kind === "table") return 1100;
	if (item.kind === "rule" || item.kind === "strike" || item.kind === "highlight") return 420;
	if (item.kind === "arrow" || item.kind === "circle") return 640;
	if (item.kind === "check" || item.kind === "cross" || item.kind === "number") return 480;
	if (item.kind === "icon" || item.kind === "badge" || item.kind === "chips") return 520;
	if (item.kind === "title") return 1100;
	const len = item.text?.length ?? 12;
	return Math.min(1600, Math.max(520, len * 28));
}
function tipFor(item, progress) {
	if (item.kind === "box" || item.kind === "formula" || item.kind === "callout" || item.kind === "table") {
		const w = item.w ?? 200;
		const h = item.h ?? 80;
		const d = progress * (2 * (w + h));
		if (d < w) return {
			x: item.x + d,
			y: item.y
		};
		if (d < w + h) return {
			x: item.x + w,
			y: item.y + (d - w)
		};
		if (d < 2 * w + h) return {
			x: item.x + w - (d - w - h),
			y: item.y + h
		};
		return {
			x: item.x,
			y: item.y + h - (d - 2 * w - h)
		};
	}
	if (item.kind === "arrow") {
		const x2 = item.x2 ?? item.x + (item.w ?? 80);
		const y2 = item.y2 ?? item.y;
		return {
			x: item.x + (x2 - item.x) * progress,
			y: item.y + (y2 - item.y) * progress
		};
	}
	const w = item.kind === "rule" || item.kind === "strike" || item.kind === "highlight" ? item.w ?? 200 : Math.min(520, (item.text?.length ?? 10) * 11);
	return {
		x: item.x + w * progress,
		y: item.y + (item.kind === "title" ? 18 : 14)
	};
}
function AppShell() {
	const playGen = (0, import_react.useRef)(0);
	const voiceRef = (0, import_react.useRef)(true);
	const pausedRef = (0, import_react.useRef)(false);
	const modeRef = (0, import_react.useRef)("full");
	const [voiceOn, setVoiceOn] = (0, import_react.useState)(true);
	const [mode, setMode] = (0, import_react.useState)("full");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [planning, setPlanning] = (0, import_react.useState)(false);
	const [playing, setPlaying] = (0, import_react.useState)(false);
	const [speaking, setSpeaking] = (0, import_react.useState)(false);
	const [mood, setMood] = (0, import_react.useState)("idle");
	const [caption, setCaption] = (0, import_react.useState)("");
	const [title, setTitle] = (0, import_react.useState)(EMPTY_LESSON.title);
	const [lesson, setLesson] = (0, import_react.useState)(EMPTY_LESSON);
	const [visible, setVisible] = (0, import_react.useState)([]);
	const [drawingId, setDrawingId] = (0, import_react.useState)(null);
	const [drawProgress, setDrawProgress] = (0, import_react.useState)(0);
	const [character, setCharacter] = (0, import_react.useState)({
		x: 320,
		y: 640
	});
	const [beatIndex, setBeatIndex] = (0, import_react.useState)(0);
	const [stepsOpen, setStepsOpen] = (0, import_react.useState)(false);
	const [shareNote, setShareNote] = (0, import_react.useState)("");
	const [colorId, setColorId] = (0, import_react.useState)("sun");
	(0, import_react.useEffect)(() => {
		try {
			const saved = localStorage.getItem(COLOR_KEY);
			if (saved && PENCIL_COLORS.some((c) => c.id === saved)) setColorId(saved);
			const savedMode = localStorage.getItem(MODE_KEY);
			if (savedMode === "short" || savedMode === "full") {
				setMode(savedMode);
				modeRef.current = savedMode;
			}
		} catch {}
	}, []);
	(0, import_react.useEffect)(() => {
		voiceRef.current = voiceOn;
		if (!voiceOn) {
			stopSpeech();
			setSpeaking(false);
		}
	}, [voiceOn]);
	const changeMode = (0, import_react.useCallback)((next) => {
		setMode(next);
		modeRef.current = next;
		try {
			localStorage.setItem(MODE_KEY, next);
		} catch {}
	}, []);
	const recolor = (0, import_react.useCallback)(() => {
		setColorId((id) => {
			const next = nextPencilColor(id);
			try {
				localStorage.setItem(COLOR_KEY, next);
			} catch {}
			return next;
		});
	}, []);
	const animateItem = (0, import_react.useCallback)(async (item, gen) => {
		setDrawingId(item.id);
		setMood("write");
		const duration = itemDuration(item);
		let elapsed = 0;
		let last = performance.now();
		await new Promise((resolve) => {
			const tick = (now) => {
				if (playGen.current !== gen) {
					resolve();
					return;
				}
				if (pausedRef.current) {
					last = now;
					requestAnimationFrame(tick);
					return;
				}
				elapsed += now - last;
				last = now;
				const t = Math.min(1, elapsed / duration);
				setDrawProgress(t);
				const tip = tipFor(item, t);
				setCharacter({
					x: Math.min(PAGE.w - 70, Math.max(8, tip.x - 40)),
					y: Math.min(3200, Math.max(8, tip.y - 160))
				});
				if (t >= 1) resolve();
				else requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		});
		if (playGen.current !== gen) return;
		setVisible((prev) => prev.some((p) => p.id === item.id) ? prev : [...prev, item]);
		setDrawingId(null);
		setDrawProgress(1);
	}, []);
	const playLesson = (0, import_react.useCallback)(async (nextLesson, fromBeat = 0) => {
		const gen = ++playGen.current;
		pausedRef.current = false;
		setLesson(nextLesson);
		setTitle(nextLesson.title);
		setPlaying(true);
		setPlanning(false);
		const keep = nextLesson.beats.slice(0, fromBeat).flatMap((b) => b.items);
		setVisible(keep);
		setDrawingId(null);
		setCaption("");
		for (let i = fromBeat; i < nextLesson.beats.length; i++) {
			if (playGen.current !== gen) return;
			while (pausedRef.current) {
				if (playGen.current !== gen) return;
				await wait(80);
			}
			const beat = nextLesson.beats[i];
			setBeatIndex(i + 1);
			setCaption(beat.caption);
			setMood("write");
			let speechDone = Promise.resolve();
			if (voiceRef.current) speechDone = speakText(beat.speech, { onSpeaking: (value) => {
				if (playGen.current === gen) setSpeaking(value);
			} }).finally(() => {
				if (playGen.current === gen) setSpeaking(false);
			});
			for (const item of beat.items) {
				if (playGen.current !== gen) return;
				while (pausedRef.current) {
					if (playGen.current !== gen) return;
					await wait(80);
				}
				await animateItem(item, gen);
			}
			if (!voiceRef.current) await wait(Math.min(1400, estimateSpeechMs(beat.speech) * .25));
			else await Promise.race([speechDone, wait(estimateSpeechMs(beat.speech) + 800)]);
		}
		if (playGen.current === gen) {
			setPlaying(false);
			setMood("idle");
			setSpeaking(false);
			setBeatIndex(nextLesson.beats.length);
		}
	}, [animateItem]);
	const sendQuestion = (0, import_react.useCallback)(async (question) => {
		const trimmed = question.trim();
		if (!trimmed || loading) return;
		playGen.current += 1;
		stopSpeech();
		setLoading(true);
		setPlanning(true);
		setPlaying(false);
		setSpeaking(false);
		setVisible([]);
		setDrawingId(null);
		setCaption(modeRef.current === "full" ? "To‘liq darsni tayyorlayapman…" : "Qisqa javobni rejalashtiryapman…");
		setMood("think");
		setCharacter({
			x: 310,
			y: 420
		});
		setBeatIndex(0);
		try {
			const result = await explainQuestion({ data: {
				question: trimmed,
				mode: modeRef.current
			} });
			if (!result.ok) {
				setCaption(result.error);
				setMood("idle");
				setPlanning(false);
				return;
			}
			const pageH = PAGE_H[result.mode];
			await playLesson(toPageLesson(result.lesson, pageH), 0);
		} catch {
			setCaption("Tarmoq xatosi yuz berdi. Birozdan so'ng qayta urinib ko'ring.");
			setMood("idle");
			setPlanning(false);
		} finally {
			setLoading(false);
		}
	}, [loading, playLesson]);
	function togglePlay() {
		if (!lesson.beats.length) return;
		if (playing) {
			pausedRef.current = true;
			setPlaying(false);
			stopSpeech();
			setSpeaking(false);
			setMood("idle");
			return;
		}
		if (beatIndex >= lesson.beats.length) {
			playLesson(lesson, 0);
			return;
		}
		pausedRef.current = false;
		playLesson(lesson, Math.max(0, beatIndex - 1));
	}
	async function share() {
		const text = `${lesson.title} — Daftar`;
		try {
			if (navigator.share) {
				await navigator.share({
					title: "Daftar",
					text
				});
				return;
			}
			await navigator.clipboard.writeText(text);
			setShareNote("Nusxa olindi");
			window.setTimeout(() => setShareNote(""), 1600);
		} catch {}
	}
	const allItems = (0, import_react.useMemo)(() => visible.concat(drawingId ? lesson.beats.flatMap((b) => b.items).filter((i) => i.id === drawingId) : []), [
		visible,
		drawingId,
		lesson
	]);
	const page = (0, import_react.useMemo)(() => lessonPageSize(lesson, PAGE_H[mode]), [lesson, mode]);
	const empty = !planning && lesson.beats.length === 0 && visible.length === 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-dvh min-h-0 flex-col bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-2 px-3 py-2.5 sm:px-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-w-0 items-center gap-2.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid size-10 place-items-center rounded-2xl bg-ink text-ink-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
							viewBox: "0 0 24 24",
							className: "size-5",
							"aria-hidden": "true",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M9 3h6l1.2 3H20v2.2l-8 15.8L4 8.2V6h3.8L9 3z",
								fill: "#E8B923"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								d: "M12 21 8.4 13h7.2L12 21z",
								fill: "#2A241C"
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "truncate text-base font-semibold tracking-tight",
							children: "Daftar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-xs text-muted",
							children: "Qalam og‘zi faqat ovozda qimirlaydi"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [shareNote ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-medium text-primary",
						children: shareNote
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mode-toggle",
						role: "group",
						"aria-label": "Javob hajmi",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: cn(mode === "short" && "is-on"),
							"aria-pressed": mode === "short",
							onClick: () => changeMode("short"),
							children: "Qisqa"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: cn(mode === "full" && "is-on"),
							"aria-pressed": mode === "full",
							onClick: () => changeMode("full"),
							children: "To‘liq"
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotebookBoard, {
				items: allItems,
				drawingId,
				drawProgress,
				character,
				mood,
				speaking,
				colorId,
				onRecolor: recolor,
				planning,
				empty,
				page
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlayerBar, {
				title: empty ? "Savol bering" : title,
				step: beatIndex,
				total: lesson.beats.length,
				playing,
				voiceOn,
				caption,
				loading,
				empty,
				onTogglePlay: togglePlay,
				onReplay: () => {
					if (lesson.beats.length) playLesson(lesson, 0);
				},
				onToggleVoice: () => setVoiceOn((v) => !v),
				onShare: () => void share(),
				onOpenSteps: () => setStepsOpen(true),
				onSend: (q) => void sendQuestion(q)
			}),
			stepsOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sheet-scrim",
				onClick: () => setStepsOpen(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sheet-panel",
					role: "dialog",
					"aria-label": "Qadamlar",
					onClick: (event) => event.stopPropagation(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between px-5 py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-base font-semibold",
							children: "Qadamlar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-sm text-muted",
							onClick: () => setStepsOpen(false),
							children: "Yopish"
						})]
					}), lesson.beats.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "space-y-2 px-4 pb-6",
						children: lesson.beats.map((beat, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "w-full rounded-xl bg-paper px-3.5 py-3 text-left text-sm shadow-[var(--shadow-border)]",
							onClick: () => {
								setStepsOpen(false);
								playLesson(lesson, i);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "mr-2 tabular-nums text-muted",
								children: [i + 1, "."]
							}), beat.caption]
						}) }, beat.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-5 pb-8 text-sm text-muted",
						children: "Avval savol yozing — qadamlar shu yerda chiqadi."
					})]
				})
			}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppShell, {});
}
//#endregion
export { Home as component };
