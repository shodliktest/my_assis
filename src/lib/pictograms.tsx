const ICONS = [
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
  "repeat",
] as const;

export type PictogramId = (typeof ICONS)[number];

export const PICTOGRAM_IDS: readonly string[] = ICONS;

export function isPictogramId(value: string | undefined): value is PictogramId {
  return !!value && (ICONS as readonly string[]).includes(value);
}

export function BoardPictogram({
  id,
  color,
  size = 52,
}: {
  id: string;
  color: string;
  size?: number;
}) {
  const name = isPictogramId(id) ? id : "idea";
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shape(name, color)}
    </svg>
  );
}

function shape(id: PictogramId, color: string) {
  switch (id) {
    case "clock":
      return (
        <>
          <circle cx="32" cy="32" r="18" />
          <path d="M32 20v13l9 5" />
        </>
      );
    case "calendar":
      return (
        <>
          <rect x="12" y="16" width="40" height="34" rx="4" />
          <path d="M12 26h40M22 12v10M42 12v10" />
          <path d="M22 36h6M32 36h6M42 36h.01M22 44h6M32 44h6" />
        </>
      );
    case "person":
      return (
        <>
          <circle cx="32" cy="20" r="8" />
          <path d="M16 50c2-12 10-16 16-16s14 4 16 16" />
        </>
      );
    case "people":
      return (
        <>
          <circle cx="22" cy="22" r="6" />
          <path d="M10 48c1-10 7-14 12-14s11 4 12 14" />
          <circle cx="42" cy="20" r="6" />
          <path d="M32 48c1-10 7-14 12-14s11 4 12 14" />
        </>
      );
    case "book":
      return (
        <>
          <path d="M12 16h18c6 0 8 4 8 4s2-4 8-4h6v34h-6c-6 0-8 4-8 4s-2-4-8-4H12V16z" />
          <path d="M32 16v34" />
        </>
      );
    case "speech":
      return (
        <>
          <rect x="12" y="14" width="40" height="26" rx="8" />
          <path d="M24 40 18 52 34 40" />
        </>
      );
    case "tv":
      return (
        <>
          <rect x="10" y="18" width="44" height="28" rx="4" />
          <path d="M24 52h16M32 18 22 10M32 18l10-8" />
        </>
      );
    case "cook":
      return (
        <>
          <path d="M14 34h36c0 12-8 18-18 18s-18-6-18-18z" />
          <path d="M20 34c0-8 4-14 12-14s12 6 12 14" />
          <path d="M50 28h6" />
        </>
      );
    case "sleep":
      return (
        <>
          <path d="M12 46c4-16 36-16 40 0" />
          <circle cx="24" cy="28" r="6" />
          <path d="M38 18h10l-10 8h10" />
        </>
      );
    case "work":
      return (
        <>
          <rect x="10" y="24" width="44" height="26" rx="3" />
          <path d="M24 24v-4a8 8 0 0 1 16 0v4" />
        </>
      );
    case "play":
      return (
        <>
          <circle cx="32" cy="32" r="18" />
          <path d="M27 22v20l16-10z" fill={color} stroke="none" />
        </>
      );
    case "warning":
      return (
        <>
          <path d="M32 10 54 50H10L32 10z" />
          <path d="M32 26v12M32 44h.01" />
        </>
      );
    case "idea":
      return (
        <>
          <circle cx="32" cy="28" r="14" />
          <path d="M26 42h12M28 48h8M32 42v6" />
        </>
      );
    case "compare":
      return (
        <>
          <rect x="8" y="16" width="20" height="32" rx="3" />
          <rect x="36" y="16" width="20" height="32" rx="3" />
          <path d="M30 32h4" />
        </>
      );
    case "now":
      return (
        <>
          <circle cx="32" cy="32" r="18" />
          <path d="M32 18v14l10 6" />
          <path d="M46 14l6 2-2 6" />
        </>
      );
    case "habit":
      return (
        <>
          <path d="M16 32a16 16 0 1 1 4 11" />
          <path d="M16 44V32h12" />
        </>
      );
    case "football":
      return (
        <>
          <circle cx="32" cy="32" r="16" />
          <path d="M32 16v32M18 24h28M18 40h28" />
        </>
      );
    case "coffee":
      return (
        <>
          <path d="M16 24h26v16a10 10 0 0 1-10 10h-6a10 10 0 0 1-10-10V24z" />
          <path d="M42 28h6a6 6 0 0 1 0 12h-6" />
          <path d="M22 14c2 3 2 5 0 8M30 14c2 3 2 5 0 8" />
        </>
      );
    case "write":
      return (
        <>
          <path d="M14 50 40 24l8 8-26 26H14v-8z" />
          <path d="M36 28l8 8" />
        </>
      );
    case "ear":
      return (
        <>
          <path d="M40 18c8 4 10 22 0 28-6 4-12 2-14-4 0-8 8-8 8-14 0-6-4-8-8-6" />
          <path d="M32 32c0 4-2 6-5 6" />
        </>
      );
    case "sun":
      return (
        <>
          <circle cx="32" cy="32" r="10" />
          <path d="M32 12v6M32 46v6M12 32h6M46 32h6M18 18l4 4M42 42l4 4M18 46l4-4M42 22l4-4" />
        </>
      );
    case "repeat":
      return (
        <>
          <path d="M18 28V18h10" />
          <path d="M18 18c8-6 28-4 32 12M46 36v10H36" />
          <path d="M46 46c-8 6-28 4-32-12" />
        </>
      );
    default:
      return <circle cx="32" cy="32" r="14" />;
  }
}
