import { cn } from "@/lib/utils";

type Mood = "idle" | "think" | "point";

export function TutorCharacter({
  x,
  y,
  mood,
}: {
  x: number;
  y: number;
  mood: Mood;
}) {
  return (
    <div
      className="tutor-char"
      style={{
        left: `min(calc(100% - 64px), max(8px, calc(${x}% - 62px)))`,
        top: `min(calc(100% - 64px), max(8px, calc(${y}% - 8px)))`,
      }}
      aria-hidden="true"
    >
      <div
        className={cn(
          "tutor-ball relative",
          mood === "think" && "is-think",
          mood === "point" && "is-point",
        )}
      >
        {/* Graduation cap */}
        <div className="tutor-cap pointer-events-none absolute -top-4 left-1/2 z-10 -translate-x-1/2 select-none text-[22px] leading-none drop-shadow-sm">
          🎓
        </div>

        <svg viewBox="0 0 64 64" className="size-full text-ball drop-shadow-md">
          <circle cx="32" cy="32" r="28" fill="currentColor" />
          <circle cx="23" cy="27" r="5.2" fill="var(--color-paper)" />
          <circle cx="41" cy="27" r="5.2" fill="var(--color-paper)" />
          <circle cx="24.4" cy="27.8" r="2.1" fill="currentColor" />
          <circle cx="42.4" cy="27.8" r="2.1" fill="currentColor" />
          <path
            d="M22 40c3.4 6 16.6 6 20 0"
            fill="none"
            stroke="var(--color-paper)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx="18" cy="35" r="2.2" fill="var(--color-margin)" opacity="0.7" />
          <circle cx="46" cy="35" r="2.2" fill="var(--color-margin)" opacity="0.7" />
        </svg>
        {mood === "point" ? (
          <span className="absolute -right-1 top-7 block h-1.5 w-4 rounded-full bg-ball" />
        ) : null}
      </div>
    </div>
  );
}
