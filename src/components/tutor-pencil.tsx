import { getPencilColor, type PencilColorId } from "@/lib/lesson";
import { cn } from "@/lib/utils";

export type PencilMood = "idle" | "think" | "write" | "speak";

export function TutorPencil({
  x,
  y,
  mood,
  colorId,
  speaking,
  onRecolor,
}: {
  x: number;
  y: number;
  mood: PencilMood;
  colorId: PencilColorId;
  speaking: boolean;
  onRecolor: () => void;
}) {
  const palette = getPencilColor(colorId);
  const writing = mood === "write";

  return (
    <div
      className={cn(
        "tutor-pencil",
        writing && "is-write",
        mood === "think" && "is-think",
        speaking && "is-speak",
      )}
      style={{
        left: x,
        top: y,
      }}
    >
      <button
        type="button"
        className="tutor-pencil-hit"
        aria-label="Qalam rangini o'zgartirish"
        title="Rangini o'zgartirish"
        onClick={(event) => {
          event.stopPropagation();
          onRecolor();
        }}
      >
        <svg viewBox="0 0 90 210" className="tutor-pencil-svg" aria-hidden="true">
          <defs>
            <linearGradient id="pencilShine" x1="0" x2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
              <stop offset="42%" stopColor="#fff" stopOpacity="0" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.12" />
            </linearGradient>
            <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodOpacity="0.22" />
            </filter>
          </defs>

          <g filter="url(#soft)">
            <rect x="31" y="6" width="28" height="22" rx="8" fill="#E7A3B0" />
            <rect x="34" y="8" width="22" height="8" rx="4" fill="#F4C4CC" />

            <rect x="29" y="26" width="32" height="18" rx="3" fill="#C9CDD3" />
            <rect x="31" y="29" width="28" height="2.2" fill="#E8EAED" />
            <rect x="31" y="34" width="28" height="2.2" fill="#9AA1AA" />
            <rect x="31" y="39" width="28" height="2.2" fill="#E8EAED" />

            <rect x="28" y="44" width="34" height="108" rx="8" fill={palette.body} />
            <rect x="28" y="44" width="34" height="108" rx="8" fill="url(#pencilShine)" />
            <path d="M49 44c10 18 12 52 11 108H62V44Z" fill="#111" opacity="0.18" />

            <path
              d="M28 118c-11 4-18 14-14 24"
              fill="none"
              stroke={palette.body}
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d="M62 120c12 6 14 22 4 32"
              fill="none"
              stroke={palette.body}
              strokeWidth="7"
              strokeLinecap="round"
            />

            <circle cx="38" cy="58" r="10" fill="#1A1A1A" opacity="0.16" />
            <circle cx="52" cy="58" r="10" fill="#F7F1E4" opacity="0.2" />

            <g className="pencil-face">
              <ellipse cx="39.5" cy="92" rx="5.2" ry="5.6" fill="#F7F1E4" />
              <ellipse cx="54.5" cy="92" rx="5.2" ry="5.6" fill="#F7F1E4" />
              <circle cx="40.4" cy="93" r="2.15" fill="#1A1A1A" />
              <circle cx="55.4" cy="93" r="2.15" fill="#1A1A1A" />
              <circle cx="41.4" cy="92.2" r="0.7" fill="#F7F1E4" />
              <circle cx="56.4" cy="92.2" r="0.7" fill="#F7F1E4" />
              {speaking ? (
                <ellipse className="pencil-mouth-speak" cx="47" cy="106" rx="5.2" ry="3.4" fill="#1A1A1A" />
              ) : (
                <path
                  d="M40 104c2.6 5.4 11.4 5.4 14 0"
                  fill="none"
                  stroke="#1A1A1A"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              )}
              <circle cx="34" cy="102" r="2.1" fill="#C45C4A" opacity="0.55" />
              <circle cx="60" cy="102" r="2.1" fill="#C45C4A" opacity="0.55" />
            </g>

            <path d="M28 152 L45 196 L62 152 Z" fill={palette.wood} />
            <path d="M34 168 L45 196 L56 168 Z" fill={palette.lead} />
            <path d="M42 188 L45 196 L48 188 Z" fill="#111" />
          </g>
        </svg>
        <span className="draw-orb" />
      </button>
    </div>
  );
}
