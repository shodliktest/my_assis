import { Fragment } from "react";
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

/** Steps joined by arrows: a process, an order, a timeline, cause → effect. */
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
  const h = item.h ?? 96;
  const n = steps.length;
  const arrowW = 28;
  const nodeW = (w - arrowW * (n - 1)) / n;
  const font = n <= 3 ? 20 : n === 4 ? 18 : 15;
  return (
    <div
      className="absolute flex items-center"
      style={{ left: item.x, top: item.y, width: w, height: h }}
    >
      {steps.map((label, i) => {
        // Each step appears during its own slice of the drawing progress.
        const t = clamp01((p - i / n) * n);
        return (
          <Fragment key={`${i}-${label}`}>
            {i > 0 ? (
              <svg
                width={arrowW}
                height={20}
                viewBox="0 0 28 20"
                fill="none"
                style={{ flex: "none", opacity: t }}
                aria-hidden="true"
              >
                <path
                  d="M3 10 H22 M16 4 L23 10 L16 16"
                  stroke={item.color}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
            <div
              className="grid place-items-center rounded-xl px-1.5 text-center font-hand leading-tight"
              style={{
                flex: "none",
                width: nodeW,
                height: h - 16,
                color: item.color,
                background: item.fill ?? "color-mix(in oklab, #93c5fd 24%, #fbf7ee)",
                fontSize: font,
                opacity: t,
                transform: `scale(${0.9 + 0.1 * t})`,
                boxShadow: "var(--shadow-border)",
                overflowWrap: "anywhere",
              }}
            >
              {label}
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

/** Horizontal bar chart from rows of [label, value, unit?]. */
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
  const rowH = 38;
  const max = Math.max(...rows.map((r) => r.value));
  const labelW = Math.round(w * 0.26);
  const valueW = 76;
  return (
    <div
      className="absolute"
      style={{ left: item.x, top: item.y, width: w, height: rows.length * rowH + 8 }}
    >
      {rows.map((row, i) => {
        const t = clamp01(p * rows.length - i);
        const pct = max > 0 ? (row.value / max) * 100 : 0;
        return (
          <div key={`${i}-${row.label}`} className="flex items-center gap-2" style={{ height: rowH, opacity: Math.min(1, t * 3) }}>
            <span
              className="font-hand"
              style={{
                width: labelW,
                flex: "none",
                color: item.color,
                fontSize: 18,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.label}
            </span>
            <div
              className="min-w-0 flex-1 rounded-md"
              style={{
                height: 20,
                background: "color-mix(in oklab, currentColor 10%, transparent)",
                color: item.color,
              }}
            >
              <div
                className="h-full rounded-md"
                style={{ width: `${pct * t}%`, background: item.fill ?? item.color, opacity: 0.85 }}
              />
            </div>
            <span
              className="font-hand"
              style={{ width: valueW, flex: "none", color: item.color, fontSize: 18, opacity: t }}
            >
              {row.shown}
            </span>
          </div>
        );
      })}
    </div>
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
