import { useEffect, useRef, useState } from "react";
import { TutorCharacter } from "@/components/tutor-character";
import type { BoardStep } from "@/lib/lesson";
import { cn } from "@/lib/utils";

type Mood = "idle" | "think" | "point";

function ArrowMark({
  step,
  width,
  height,
}: {
  step: BoardStep;
  width: number;
  height: number;
}) {
  const x1 = (step.x / 100) * width;
  const y1 = (step.y / 100) * height;
  const x2 = ((step.x2 ?? Math.min(92, step.x + 16)) / 100) * width;
  const y2 = ((step.y2 ?? step.y) / 100) * height;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 11;
  const hx = x2 - Math.cos(angle) * head;
  const hy = y2 - Math.sin(angle) * head;

  return (
    <g className="board-item">
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={step.color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <polygon
        fill={step.color}
        points={`${x2},${y2} ${hx + Math.cos(angle + Math.PI / 2) * 5},${hy + Math.sin(angle + Math.PI / 2) * 5} ${hx + Math.cos(angle - Math.PI / 2) * 5},${hy + Math.sin(angle - Math.PI / 2) * 5}`}
      />
      {step.content ? (
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 10}
          fill={step.color}
          fontSize={18}
          fontFamily="var(--font-hand)"
          textAnchor="middle"
        >
          {step.content}
        </text>
      ) : null}
    </g>
  );
}

function StepNode({ step }: { step: BoardStep }) {
  if (step.type === "arrow") return null;

  const common = {
    left: `${step.x}%`,
    top: `${step.y}%`,
    color: step.color,
  } as const;

  if (step.type === "title") {
    return (
      <h2
        className="board-item absolute max-w-[78%] font-hand text-4xl font-semibold leading-tight tracking-tight md:text-5xl"
        style={common}
      >
        {step.content}
      </h2>
    );
  }

  if (step.type === "box") {
    return (
      <div
        className="board-item absolute max-w-[78%] rounded-lg border-2 bg-paper/80 px-3.5 py-2.5 font-hand text-2xl leading-snug shadow-[var(--shadow-border)]"
        style={{
          ...common,
          borderColor: step.color,
          color: step.color,
        }}
      >
        {step.content}
      </div>
    );
  }

  if (step.type === "highlight") {
    return (
      <p
        className="board-item absolute max-w-[80%] -rotate-1 px-2 py-0.5 font-hand text-2xl leading-snug"
        style={{
          ...common,
          background: "color-mix(in oklab, var(--color-highlight) 82%, transparent)",
          color: step.color,
        }}
      >
        {step.content}
      </p>
    );
  }

  return (
    <p
      className="board-item absolute max-w-[78%] font-hand text-[1.65rem] leading-snug"
      style={common}
    >
      {step.content}
    </p>
  );
}

export function NotebookBoard({
  steps,
  character,
  mood,
}: {
  steps: BoardStep[];
  character: { x: number; y: number };
  mood: Mood;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 720 });

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const measure = () => {
      setSize({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const arrows = steps.filter((step) => step.type === "arrow");

  return (
    <section
      className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      aria-label="O'quv daftari"
    >
      <div className="relative min-h-0 flex-1 overflow-auto">
        <div
          ref={pageRef}
          className="notebook-page relative min-h-full w-full"
          style={{ minHeight: 720 }}
        >
          <div className="notebook-gutter pointer-events-none absolute inset-y-0 left-0 w-14" />
          <div className="pointer-events-none absolute inset-y-0 left-14 w-px bg-margin/70" />
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="pointer-events-none absolute left-4 size-3.5 rounded-full bg-border shadow-[inset_0_1px_2px_rgba(28,25,23,0.18)]"
              style={{ top: `${18 + i * 22}%` }}
            />
          ))}

          {steps.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center px-10">
              <p className="max-w-sm text-center font-hand text-3xl leading-snug text-muted">
                Savolingizni shu daftarga chizib tushuntiraman
              </p>
            </div>
          ) : null}

          <svg
            className="pointer-events-none absolute inset-0"
            width={size.w}
            height={size.h}
            viewBox={`0 0 ${size.w} ${size.h}`}
            fill="none"
          >
            {arrows.map((step, i) => (
              <ArrowMark
                key={`${step.content}-${i}`}
                step={step}
                width={size.w}
                height={size.h}
              />
            ))}
          </svg>

          {steps.map((step, i) => (
            <StepNode key={`${step.type}-${step.content}-${i}`} step={step} />
          ))}

          <TutorCharacter x={character.x} y={character.y} mood={mood} />
        </div>
      </div>
    </section>
  );
}
