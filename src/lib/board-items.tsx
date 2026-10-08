import { Fragment, useId, type CSSProperties } from "react";
import { formatTick, layoutGraph, niceStep } from "@/lib/graph-plot";
import {
  barsMetrics,
  flowMetrics,
  graphHeight,
  iconsMetrics,
  ICON_ARROW_W,
  ICON_PX,
  timelineMetrics,
} from "@/lib/layout-metrics";
import { BoardPictogram } from "@/lib/pictograms";
import { type DrawItem } from "@/lib/lesson";
import { cn } from "@/lib/utils";

export function fontSize(size?: DrawItem["size"]) {
  if (size === "xl") return 34;
  if (size === "lg") return 26;
  if (size === "sm") return 18;
  return 22;
}

function BoxStroke({ item, progress }: { item: DrawItem; progress: number }) {
  const w = item.w ?? 200;
  const h = item.h ?? 80;
  const r = 12;
  const path = `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`;
  return (
    <svg
      className="pointer-events-none absolute"
      style={{ left: item.x, top: item.y, width: w, height: h }}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
    >
      <path
        d={path}
        stroke={item.color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
      />
    </svg>
  );
}

function TextReveal({
  item,
  drawing,
  progress,
  className,
}: {
  item: DrawItem;
  drawing: boolean;
  progress: number;
  className?: string;
}) {
  const reveal = drawing ? Math.max(8, progress * 100) : 100;
  return (
    <p
      className={cn("board-item absolute font-hand leading-snug", className)}
      style={{
        left: item.x,
        top: item.y,
        width: item.w ?? 640,
        color: item.color,
        fontSize: fontSize(item.size),
        clipPath: `inset(0 ${100 - reveal}% 0 0)`,
      }}
    >
      {item.text}
    </p>
  );
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** "12", "1,5", "12 kg" → number; anything without digits → NaN. */
export function parseBarValue(cell: string | undefined): number {
  const cleaned = String(cell ?? "")
    .replace(/\s/g, "")
    .replace(",", ".")
    .replace(/[^\d.\-]/g, "");
  if (!/\d/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

const PALETTE = [
  { ink: "#1d4ed8", bg: "#dbe7fb" },
  { ink: "#0f6b63", bg: "#d8efe4" },
  { ink: "#b45309", bg: "#fbe6c8" },
  { ink: "#7e3aa8", bg: "#ecdcf6" },
  { ink: "#b42318", bg: "#f9d9d6" },
] as const;

function Arrow({ color, down, style }: { color: string; down?: boolean; style?: CSSProperties }) {
  return (
    <svg
      width={down ? 20 : 28}
      height={down ? 20 : 20}
      viewBox={down ? "0 0 20 20" : "0 0 28 20"}
      fill="none"
      style={{ flex: "none", ...style }}
      aria-hidden="true"
    >
      <path
        d={down ? "M10 2 V15 M4 10 L10 16 L16 10" : "M3 10 H22 M16 4 L23 10 L16 16"}
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Steps joined by arrows: a process, an order, a cause → effect. Stacks top to bottom in a narrow column. */
function FlowView({ item, p }: { item: DrawItem; p: number }) {
  const steps = (
    item.chips?.length
      ? item.chips
      : (item.text ?? "").split(/→|->|·|,/).map((s) => s.trim())
  )
    .filter(Boolean)
    .slice(0, 5);
  if (!steps.length) return null;
  const w = item.w ?? 580;
  const m = flowMetrics(steps.length, w);
  const h = item.h ?? m.h;
  const n = steps.length;
  const font = m.vertical ? 18 : n <= 3 ? 20 : n === 4 ? 18 : 15;
  const node = (label: string, t: number, style: CSSProperties) => (
    <div
      className="grid place-items-center rounded-xl px-1.5 text-center font-hand leading-tight"
      style={{
        flex: "none",
        color: item.color,
        background: item.fill ?? "color-mix(in oklab, #93c5fd 24%, #fbf7ee)",
        fontSize: font,
        opacity: t,
        transform: `scale(${0.9 + 0.1 * t})`,
        boxShadow: "var(--shadow-border)",
        overflowWrap: "anywhere",
        ...style,
      }}
    >
      {label}
    </div>
  );
  return (
    <div
      className="absolute flex items-center"
      style={{
        left: item.x,
        top: item.y,
        width: w,
        height: h,
        flexDirection: m.vertical ? "column" : "row",
      }}
    >
      {steps.map((label, i) => {
        // Each step appears during its own slice of the drawing progress.
        const t = clamp01((p - i / n) * n);
        return (
          <Fragment key={`${i}-${label}`}>
            {i > 0 ? <Arrow color={item.color} down={m.vertical} style={{ opacity: t, margin: m.vertical ? "1px 0" : 0 }} /> : null}
            {node(label, t, m.vertical ? { width: w, height: 42 } : { width: m.nodeW, height: h - 16 })}
          </Fragment>
        );
      })}
    </div>
  );
}

const BAR_FILL = "#bcd5f5";
const BAR_INK = "#2563eb";

/** Bar chart from rows of [label, value, unit?]: columns with an axis, or rows when names are long. */
function BarsView({ item, p }: { item: DrawItem; p: number }) {
  const rows = (item.rows ?? [])
    .map((r) => ({
      label: String(r[0] ?? "").trim(),
      value: parseBarValue(r[1]),
      shown: `${String(r[1] ?? "").trim()}${r[2] ? ` ${String(r[2]).trim()}` : ""}`,
    }))
    .filter((r) => r.label && Number.isFinite(r.value) && r.value >= 0)
    .slice(0, 6);
  if (!rows.length) return null;
  const w = item.w ?? 580;
  const max = Math.max(...rows.map((r) => r.value));
  const m = barsMetrics(item.rows, w);
  const h = item.h ?? m.h;

  if (m.vertical) {
    const left = 46;
    const right = 12;
    const top = 26;
    const bottom = 34;
    const pw = w - left - right;
    const ph = h - top - bottom;
    const step = niceStep(max || 1, 4);
    const topV = Math.max(step, Math.ceil((max || 1) / step) * step);
    const ticks: number[] = [];
    for (let v = 0; v <= topV + step * 1e-6; v += step) ticks.push(Number(v.toPrecision(12)));
    const Y = (v: number) => top + ph - (v / topV) * ph;
    const slot = pw / rows.length;
    const barW = Math.min(64, slot * 0.56);
    const frame = clamp01(p * 6);
    return (
      <svg
        className="pointer-events-none absolute font-hand"
        style={{ left: item.x, top: item.y, width: w, height: h, overflow: "visible" }}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={rows.map((r) => `${r.label}: ${r.shown}`).join(", ")}
      >
        <g opacity={frame}>
          {ticks.map((v) => (
            <g key={`t${v}`}>
              <line x1={left} x2={left + pw} y1={Y(v)} y2={Y(v)} stroke={item.color} strokeOpacity={v === 0 ? 0.8 : 0.14} strokeWidth={v === 0 ? 2 : 1} />
              <text x={left - 8} y={Y(v) + 5} textAnchor="end" fontSize={15} fill={item.color}>
                {formatTick(v, step)}
              </text>
            </g>
          ))}
          <line x1={left} x2={left} y1={top} y2={top + ph} stroke={item.color} strokeWidth={2} />
        </g>
        {rows.map((r, i) => {
          const t = clamp01(p * rows.length * 0.9 - i * 0.9);
          const bh = (r.value / topV) * ph * t;
          const cx = left + slot * i + slot / 2;
          const label = r.label.length > 12 ? `${r.label.slice(0, 11)}…` : r.label;
          return (
            <g key={`b${i}-${r.label}`}>
              <rect x={cx - barW / 2} y={top + ph - bh} width={barW} height={bh} rx={4} fill={item.fill ?? BAR_FILL} stroke={BAR_INK} strokeWidth={2} />
              <text x={cx} y={top + ph - bh - 7} textAnchor="middle" fontSize={16} fill={BAR_INK} opacity={t}>
                {r.shown}
              </text>
              <text x={cx} y={top + ph + 22} textAnchor="middle" fontSize={15} fill={item.color} opacity={Math.min(1, t * 3)}>
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  const rowH = 38;
  const labelW = Math.round(w * 0.26);
  const valueW = 76;
  return (
    <div className="absolute" style={{ left: item.x, top: item.y, width: w, height: h }}>
      {rows.map((row, i) => {
        const t = clamp01(p * rows.length - i);
        const pct = max > 0 ? (row.value / max) * 100 : 0;
        return (
          <div key={`${i}-${row.label}`} className="flex items-center gap-2" style={{ height: rowH, opacity: Math.min(1, t * 3) }}>
            <span
              className="font-hand"
              style={{ width: labelW, flex: "none", color: item.color, fontSize: 18, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {row.label}
            </span>
            <div className="min-w-0 flex-1 rounded-md" style={{ height: 20, background: "color-mix(in oklab, currentColor 10%, transparent)", color: item.color }}>
              <div className="h-full rounded-md" style={{ width: `${pct * t}%`, background: item.fill ?? BAR_INK, opacity: 0.85 }} />
            </div>
            <span className="font-hand" style={{ width: valueW, flex: "none", color: item.color, fontSize: 18, opacity: t }}>
              {row.shown}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Dates on an axis with a card per event: history, biography, development of an idea. */
function TimelineView({ item, p }: { item: DrawItem; p: number }) {
  const events = (item.rows ?? [])
    .map((r) => ({ date: String(r[0] ?? "").trim(), title: String(r[1] ?? "").trim(), detail: String(r[2] ?? "").trim() }))
    .filter((e) => e.date || e.title)
    .slice(0, 5);
  if (!events.length) return null;
  const w = item.w ?? 580;
  const rows = events.map((e) => [e.date, e.title, e.detail]);
  const m = timelineMetrics(rows, w);
  const h = item.h ?? m.h;
  const n = events.length;
  const ink = item.color;

  const card = (e: (typeof events)[number], i: number, style: CSSProperties) => {
    const c = PALETTE[i % PALETTE.length];
    return (
      <div
        className="absolute rounded-xl font-hand leading-tight"
        style={{ background: c.bg, border: `2px solid ${c.ink}`, padding: "7px 9px", boxSizing: "border-box", overflow: "hidden", ...style }}
      >
        <div style={{ color: c.ink, fontSize: 18, fontWeight: 600, lineHeight: "25px" }}>{e.title}</div>
        {e.detail ? <div style={{ color: "#3a3a3a", fontSize: 15, lineHeight: "21px", marginTop: 2 }}>{e.detail}</div> : null}
      </div>
    );
  };

  if (!m.vertical) {
    const axisY = 36;
    return (
      <div className="absolute" style={{ left: item.x, top: item.y, width: w, height: h }}>
        <svg className="absolute font-hand" style={{ left: 0, top: 0, overflow: "visible" }} width={w} height={62} viewBox={`0 0 ${w} 62`} aria-hidden="true">
          <line x1={0} x2={w - 6} y1={axisY} y2={axisY} stroke={ink} strokeWidth={2} opacity={clamp01(p * 6)} />
          <path d={`M${w - 12} ${axisY - 5} L${w - 2} ${axisY} L${w - 12} ${axisY + 5}`} stroke={ink} strokeWidth={2} fill="none" opacity={clamp01(p * 6)} />
          {events.map((e, i) => {
            const t = clamp01(p * n - i);
            const cx = i * (m.cardW + 12) + m.cardW / 2;
            const c = PALETTE[i % PALETTE.length];
            return (
              <g key={`d${i}`} opacity={t}>
                <text x={cx} y={20} textAnchor="middle" fontSize={18} fontWeight={600} fill={c.ink}>
                  {e.date}
                </text>
                <circle cx={cx} cy={axisY} r={6} fill={c.ink} />
                <line x1={cx} x2={cx} y1={axisY + 6} y2={62} stroke={c.ink} strokeWidth={2} />
              </g>
            );
          })}
        </svg>
        {events.map((e, i) => {
          const t = clamp01(p * n - i);
          return (
            <Fragment key={`c${i}`}>
              {card(e, i, { left: i * (m.cardW + 12), top: 62, width: m.cardW, height: m.cardH, opacity: t, transform: `translateY(${(1 - t) * 8}px)` })}
            </Fragment>
          );
        })}
      </div>
    );
  }

  // Narrow column: one row per event, dates on the left of a vertical rail.
  let y = 0;
  const railX = 88;
  return (
    <div className="absolute" style={{ left: item.x, top: item.y, width: w, height: h }}>
      <div className="absolute" style={{ left: railX - 1, top: 6, width: 2, height: Math.max(0, h - 12), background: ink, opacity: clamp01(p * 6) * 0.6 }} />
      {events.map((e, i) => {
        const t = clamp01(p * n - i);
        const rowH = m.rowHs?.[i] ?? 56;
        const top = y;
        y += rowH + 12;
        const c = PALETTE[i % PALETTE.length];
        return (
          <Fragment key={`r${i}`}>
            <div className="absolute font-hand" style={{ left: 0, top: top + 4, width: railX - 14, textAlign: "right", color: c.ink, fontSize: 18, fontWeight: 600, opacity: t }}>
              {e.date}
            </div>
            <div className="absolute" style={{ left: railX - 6, top: top + 10, width: 12, height: 12, borderRadius: 9999, background: c.ink, opacity: t }} />
            {card(e, i, { left: railX + 14, top, width: w - railX - 14, height: rowH, opacity: t, transform: `translateX(${(1 - t) * 10}px)` })}
          </Fragment>
        );
      })}
    </div>
  );
}

/** A row of pictures with captions (optionally joined by arrows): inputs, parts, stages. */
function IconsView({ item, p }: { item: DrawItem; p: number }) {
  const cells = (item.rows ?? [])
    .map((r) => ({ icon: String(r[0] ?? "").trim().toLowerCase(), label: String(r[1] ?? "").trim() }))
    .filter((c) => c.icon || c.label)
    .slice(0, 5);
  if (!cells.length) return null;
  const w = item.w ?? 580;
  const arrows = item.text === "→";
  const m = iconsMetrics(item.rows, w, arrows);
  const h = item.h ?? m.h;
  const n = cells.length;
  return (
    <div className="absolute flex" style={{ left: item.x, top: item.y, width: w, height: h, alignItems: "flex-start" }}>
      {cells.map((c, i) => {
        const t = clamp01(p * n - i);
        const col = PALETTE[i % PALETTE.length];
        return (
          <Fragment key={`${i}-${c.icon}`}>
            {arrows && i > 0 ? (
              <div style={{ width: ICON_ARROW_W, height: ICON_PX, display: "grid", placeItems: "center", opacity: t }}>
                <Arrow color={item.color} style={{ width: 22 }} />
              </div>
            ) : null}
            <div style={{ width: m.cellW, flex: "none", textAlign: "center", opacity: t, transform: `scale(${0.85 + 0.15 * t})` }}>
              <div style={{ width: ICON_PX, height: ICON_PX, margin: "0 auto" }}>
                <BoardPictogram id={c.icon} color={col.ink} size={ICON_PX} />
              </div>
              <div className="font-hand leading-tight" style={{ marginTop: 8, color: col.ink, fontSize: 17, fontWeight: 600, overflowWrap: "anywhere" }}>
                {c.label}
              </div>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

/** Coordinate plane: axes, grid, curves sampled from formulas, marked points, guides. */
function GraphView({ item, p }: { item: DrawItem; p: number }) {
  const rawId = useId();
  const spec = item.graph;
  if (!spec) return null;
  const w = item.w ?? 580;
  const h = item.h ?? graphHeight(w);
  const g = layoutGraph(spec, w, h);
  const clipId = `plot-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const ink = item.color;
  const frame = clamp01(p * 5); // grid and axes appear first
  const curveSlot = spec.fn.length + (g.line ? 1 : 0);
  const curveT = (i: number) =>
    curveSlot ? clamp01(((p - 0.15) / 0.65) * curveSlot - i) : 1;
  const marks = clamp01((p - 0.8) * 5); // points, guides, legend last
  const { x0, y0, x1, y1 } = g.plot;

  return (
    <svg
      className="pointer-events-none absolute font-hand"
      style={{ left: item.x, top: item.y, width: w, height: h, overflow: "visible" }}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={spec.fn.map((c) => c.label ?? c.expr).join(", ") || "Grafik"}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} />
        </clipPath>
      </defs>

      <g opacity={frame}>
        <rect
          x={x0}
          y={y0}
          width={x1 - x0}
          height={y1 - y0}
          rx={6}
          fill="rgba(255,255,255,0.55)"
          stroke={ink}
          strokeOpacity={0.35}
        />
        {g.xTicks.map((t) => (
          <g key={`xt${t.v}`}>
            <line x1={t.px} x2={t.px} y1={y0} y2={y1} stroke={ink} strokeOpacity={0.12} />
            <text x={t.px} y={y1 + 18} textAnchor="middle" fontSize={15} fill={ink}>
              {t.label}
            </text>
          </g>
        ))}
        {g.yTicks.map((t) => (
          <g key={`yt${t.v}`}>
            <line x1={x0} x2={x1} y1={t.px} y2={t.px} stroke={ink} strokeOpacity={0.12} />
            <text x={x0 - 8} y={t.px + 5} textAnchor="end" fontSize={15} fill={ink}>
              {t.label}
            </text>
          </g>
        ))}
        {g.yAxisPx !== null ? (
          <line x1={g.yAxisPx} x2={g.yAxisPx} y1={y0} y2={y1} stroke={ink} strokeWidth={2} />
        ) : null}
        {g.xAxisPx !== null ? (
          <line x1={x0} x2={x1} y1={g.xAxisPx} y2={g.xAxisPx} stroke={ink} strokeWidth={2} />
        ) : null}
        {spec.xlabel ? (
          <text x={(x0 + x1) / 2} y={h - 4} textAnchor="middle" fontSize={16} fill={ink}>
            {spec.xlabel}
          </text>
        ) : null}
        {spec.ylabel ? (
          <text
            transform={`translate(13 ${(y0 + y1) / 2}) rotate(-90)`}
            textAnchor="middle"
            fontSize={16}
            fill={ink}
          >
            {spec.ylabel}
          </text>
        ) : null}
      </g>

      <g clipPath={`url(#${clipId})`}>
        {g.vlines.map((v) => (
          <line
            key={`v${v.px}`}
            x1={v.px}
            x2={v.px}
            y1={y0}
            y2={y1}
            stroke="#b45309"
            strokeWidth={2}
            strokeDasharray="7 6"
            opacity={marks}
          />
        ))}
        {g.hlines.map((v) => (
          <line
            key={`h${v.px}`}
            x1={x0}
            x2={x1}
            y1={v.px}
            y2={v.px}
            stroke="#b45309"
            strokeWidth={2}
            strokeDasharray="7 6"
            opacity={marks}
          />
        ))}
        {g.curves.map((c, i) => (
          <path
            key={`c${i}`}
            d={c.d}
            fill="none"
            stroke={c.color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - curveT(i)}
          />
        ))}
        {g.line ? (
          <path
            d={g.line}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - curveT(spec.fn.length)}
          />
        ) : null}
      </g>

      <g opacity={marks}>
        {g.vlines.map((v) => (
          <text key={`vl${v.px}`} x={v.px + 6} y={y0 + 16} fontSize={15} fill="#b45309">
            {v.label}
          </text>
        ))}
        {g.hlines.map((v) => (
          <text key={`hl${v.px}`} x={x1 - 6} y={v.px - 6} textAnchor="end" fontSize={15} fill="#b45309">
            {v.label}
          </text>
        ))}
        {g.points.map((pt, i) => (
          <g key={`p${i}`}>
            <circle cx={pt.px} cy={pt.py} r={5.5} fill="#b42318" stroke="#fbf7ee" strokeWidth={2} />
            {pt.label ? (
              <text
                x={pt.px + pt.dx}
                y={pt.py + pt.dy}
                textAnchor={pt.anchor}
                fontSize={16}
                fill="#7f1d1d"
                stroke="#fbf7ee"
                strokeWidth={4}
                paintOrder="stroke"
              >
                {pt.label}
              </text>
            ) : null}
          </g>
        ))}
        {g.legend ? (
          <g>
            {g.curves.map((c, i) => (
              <g key={`lg${i}`} transform={`translate(${g.legend!.x + 8} ${g.legend!.y + 16 + i * 20})`}>
                <rect y={-9} width={16} height={4} rx={2} fill={c.color} />
                <text x={22} y={0} fontSize={15} fill={ink}>
                  {c.label}
                </text>
              </g>
            ))}
          </g>
        ) : null}
      </g>
    </svg>
  );
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

/** A code listing that types in line by line. Comment lines are dimmed. */
function CodeView({ item, p }: { item: DrawItem; p: number }) {
  const lines = (item.text ?? "").split("\n").slice(0, 14);
  if (!lines.length) return null;
  const w = item.w ?? 580;
  const shown = Math.max(1, Math.ceil(clamp01(p) * lines.length));
  return (
    <pre
      className="absolute overflow-hidden rounded-xl"
      style={{
        left: item.x,
        top: item.y,
        width: w,
        height: item.h ?? lines.length * 24 + 28,
        margin: 0,
        padding: "14px 16px",
        background: "#1e293b",
        color: "#e2e8f0",
        fontFamily: MONO,
        fontSize: 16,
        lineHeight: "24px",
        tabSize: 4,
        whiteSpace: "pre",
        boxShadow: "var(--shadow-border)",
      }}
    >
      {lines.map((line, i) => {
        const dim = /^\s*(#|\/\/|--)/.test(line);
        return (
          <span
            key={i}
            style={{ display: "block", opacity: i < shown ? 1 : 0, color: dim ? "#94a3b8" : undefined }}
          >
            {line || " "}
          </span>
        );
      })}
    </pre>
  );
}

export function BoardItemView({
  item,
  drawing,
  progress,
}: {
  item: DrawItem;
  drawing: boolean;
  progress: number;
}) {
  const p = Math.max(0, Math.min(1, progress));

  if (item.kind === "box") {
    const w = item.w ?? 200;
    const h = item.h ?? 80;
    return (
      <>
        <div
          className="board-item absolute rounded-[12px]"
          style={{
            left: item.x,
            top: item.y,
            width: w,
            height: h,
            background: item.fill ?? "transparent",
            opacity: Math.min(1, p * 1.4),
            boxShadow: "var(--shadow-border)",
          }}
        />
        <BoxStroke item={item} progress={p} />
      </>
    );
  }

  if (item.kind === "flow") return <FlowView item={item} p={p} />;
  if (item.kind === "bars") return <BarsView item={item} p={p} />;
  if (item.kind === "graph") return <GraphView item={item} p={p} />;
  if (item.kind === "code") return <CodeView item={item} p={p} />;
  if (item.kind === "timeline") return <TimelineView item={item} p={p} />;
  if (item.kind === "icons") return <IconsView item={item} p={p} />;

  if (item.kind === "highlight") {
    const w = item.w ?? 180;
    const h = item.h ?? 28;
    return (
      <div
        className="absolute origin-left rounded-sm"
        style={{
          left: item.x,
          top: item.y,
          width: w,
          height: h,
          background: item.fill ?? item.color,
          opacity: 0.45 * p,
          transform: `scaleX(${p})`,
        }}
      />
    );
  }

  if (item.kind === "rule" || item.kind === "strike") {
    const w = item.w ?? 200;
    return (
      <div
        className="absolute origin-left"
        style={{
          left: item.x,
          top: item.y,
          width: w,
          height: item.kind === "strike" ? 3 : 1,
          background: item.color,
          opacity: item.kind === "strike" ? 0.85 : 0.45,
          transform: `scaleX(${p}) rotate(${item.kind === "strike" ? -2 : 0}deg)`,
        }}
      />
    );
  }

  if (item.kind === "circle") {
    const w = item.w ?? 64;
    const h = item.h ?? w;
    return (
      <svg
        className="pointer-events-none absolute"
        style={{ left: item.x, top: item.y, width: w, height: h }}
        viewBox={`0 0 ${w} ${h}`}
      >
        <ellipse
          cx={w / 2}
          cy={h / 2}
          rx={w / 2 - 2}
          ry={h / 2 - 2}
          fill={item.fill ?? "transparent"}
          stroke={item.color}
          strokeWidth={2.6}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
        />
        {item.text ? (
          <text
            x="50%"
            y="54%"
            textAnchor="middle"
            fill={item.color}
            fontSize={Math.min(22, h * 0.38)}
            fontFamily="Caveat, cursive"
            opacity={p}
          >
            {item.text}
          </text>
        ) : null}
      </svg>
    );
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
    return (
      <svg
        className="pointer-events-none absolute"
        style={{ left: minX, top: minY, width: w, height: h }}
        viewBox={`0 0 ${w} ${h}`}
      >
        <line
          x1={x1}
          y1={y1}
          x2={dx}
          y2={dy}
          stroke={item.color}
          strokeWidth={2.6}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - p}
        />
        <polygon
          points={`${dx},${dy} ${dx - ah * Math.cos(angle - 0.45)},${dy - ah * Math.sin(angle - 0.45)} ${dx - ah * Math.cos(angle + 0.45)},${dy - ah * Math.sin(angle + 0.45)}`}
          fill={item.color}
          opacity={p}
        />
      </svg>
    );
  }

  if (item.kind === "check" || item.kind === "cross") {
    const s = item.w ?? 36;
    return (
      <svg
        className="pointer-events-none absolute"
        style={{ left: item.x, top: item.y, width: s, height: s }}
        viewBox="0 0 36 36"
        fill="none"
      >
        {item.kind === "check" ? (
          <path
            d="M6 19 L14 27 L30 9"
            stroke={item.color}
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - p}
          />
        ) : (
          <>
            <path
              d="M8 8 L28 28"
              stroke={item.color}
              strokeWidth="3.2"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
            />
            <path
              d="M28 8 L8 28"
              stroke={item.color}
              strokeWidth="3.2"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - p}
            />
          </>
        )}
      </svg>
    );
  }

  if (item.kind === "number") {
    const s = item.w ?? 40;
    return (
      <div
        className="absolute grid place-items-center rounded-full font-hand font-semibold"
        style={{
          left: item.x,
          top: item.y,
          width: s,
          height: s,
          background: item.fill ?? item.color,
          color: "var(--color-paper)",
          fontSize: s * 0.48,
          transform: `scale(${0.7 + 0.3 * p})`,
          opacity: p,
        }}
      >
        {item.text ?? "1"}
      </div>
    );
  }

  if (item.kind === "badge") {
    return (
      <span
        className="absolute inline-flex items-center rounded-full px-3 py-1 font-hand text-lg leading-none"
        style={{
          left: item.x,
          top: item.y,
          color: item.color,
          background: item.fill ?? "color-mix(in oklab, #93c5fd 26%, #fbf7ee)",
          opacity: p,
          transform: `scale(${0.86 + 0.14 * p})`,
          boxShadow: "var(--shadow-border)",
        }}
      >
        {item.text}
      </span>
    );
  }

  if (item.kind === "chips") {
    const chips = item.chips?.length ? item.chips : item.text ? item.text.split("·").map((s) => s.trim()) : [];
    return (
      <div
        className="absolute flex flex-wrap gap-1.5"
        style={{
          left: item.x,
          top: item.y,
          width: item.w ?? 620,
          opacity: p,
        }}
      >
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full px-2.5 py-1 font-hand text-[17px] leading-none"
            style={{
              color: item.color,
              background: item.fill ?? "color-mix(in oklab, #fcd34d 30%, #fbf7ee)",
              boxShadow: "var(--shadow-border)",
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    );
  }

  if (item.kind === "formula") {
    const w = item.w ?? 620;
    const h = item.h ?? 64;
    return (
      <div
        className="absolute grid place-items-center rounded-xl px-3 font-hand font-semibold"
        style={{
          left: item.x,
          top: item.y,
          width: w,
          height: h,
          color: item.color,
          background: item.fill ?? "color-mix(in oklab, #fcd34d 32%, #fbf7ee)",
          fontSize: fontSize(item.size ?? "lg"),
          opacity: p,
          boxShadow: "var(--shadow-border)",
        }}
      >
        {item.text}
      </div>
    );
  }

  if (item.kind === "callout") {
    const w = item.w ?? 280;
    const h = item.h ?? 90;
    return (
      <div
        className="absolute rounded-2xl px-3 py-2 font-hand leading-snug"
        style={{
          left: item.x,
          top: item.y,
          width: w,
          minHeight: h,
          color: item.color,
          background: item.fill ?? "color-mix(in oklab, #93c5fd 24%, #fbf7ee)",
          fontSize: fontSize(item.size ?? "sm"),
          opacity: p,
          boxShadow: "var(--shadow-border)",
        }}
      >
        {item.text}
      </div>
    );
  }

  if (item.kind === "table") {
    const w = item.w ?? 620;
    const rows = item.rows?.length
      ? item.rows
      : (item.text ?? "")
          .split("|")
          .map((row) => row.split(",").map((c) => c.trim()))
          .filter((r) => r.length && r[0]);
    return (
      <div
        className="absolute overflow-hidden rounded-xl"
        style={{
          left: item.x,
          top: item.y,
          width: w,
          opacity: p,
          boxShadow: "var(--shadow-border)",
          background: item.fill ?? "color-mix(in oklab, #93c5fd 12%, #fbf7ee)",
        }}
      >
        <table className="w-full border-collapse font-hand" style={{ color: item.color, fontSize: 18 }}>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i === 0 ? "font-semibold" : undefined}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="border px-2 py-1.5"
                    style={{ borderColor: "color-mix(in oklab, currentColor 28%, transparent)" }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (item.kind === "icon") {
    const s = item.w ?? 56;
    return (
      <div
        className="absolute"
        style={{ left: item.x, top: item.y, width: s, height: s, opacity: p }}
      >
        <BoardPictogram id={item.icon ?? "idea"} color={item.color} size={s} />
      </div>
    );
  }

  return (
    <TextReveal
      item={item}
      drawing={drawing}
      progress={p}
      className={item.kind === "title" ? "font-semibold tracking-tight" : undefined}
    />
  );
}
