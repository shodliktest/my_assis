import { ICON_IDS, isPictogramId, type PictogramId } from "./icon-ids.ts";

export const PICTOGRAM_IDS: readonly string[] = ICON_IDS;
export { isPictogramId };
export type { PictogramId };

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
    case "leaf":
      return (
        <>
          <path d="M12 50C12 26 28 12 52 12c0 24-14 40-40 38z" />
          <path d="M12 52 38 26" />
          <path d="M26 38h10M32 30h10" />
        </>
      );
    case "drop":
      return (
        <>
          <path d="M32 8C26 20 14 30 14 41a18 18 0 0 0 36 0C50 30 38 20 32 8z" />
          <path d="M22 42a10 10 0 0 0 8 9" />
        </>
      );
    case "cloud":
      return <path d="M18 46h28a10 10 0 0 0 2-20 15 15 0 0 0-28-4A12 12 0 0 0 18 46z" />;
    case "rain":
      return (
        <>
          <path d="M18 36h28a9 9 0 0 0 2-18 14 14 0 0 0-26-4A11 11 0 0 0 18 36z" />
          <path d="M22 44l-3 8M33 44l-3 8M44 44l-3 8" />
        </>
      );
    case "bolt":
      return <path d="M36 6 18 36h13l-4 22 20-32H33z" />;
    case "atom":
      return (
        <>
          <ellipse cx="32" cy="32" rx="25" ry="9" />
          <ellipse cx="32" cy="32" rx="25" ry="9" transform="rotate(60 32 32)" />
          <ellipse cx="32" cy="32" rx="25" ry="9" transform="rotate(120 32 32)" />
          <circle cx="32" cy="32" r="3.5" fill={color} stroke="none" />
        </>
      );
    case "flask":
      return (
        <>
          <path d="M26 8h12M28 8v16L13 50a5 5 0 0 0 4 8h30a5 5 0 0 0 4-8L36 24V8" />
          <path d="M19 42h26" />
          <circle cx="30" cy="48" r="1.5" fill={color} stroke="none" />
          <circle cx="38" cy="46" r="1.5" fill={color} stroke="none" />
        </>
      );
    case "magnet":
      return (
        <>
          <path d="M14 10v24a18 18 0 0 0 36 0V10H38v24a6 6 0 0 1-12 0V10z" />
          <path d="M14 20h12M38 20h12" />
        </>
      );
    case "globe":
      return (
        <>
          <circle cx="32" cy="32" r="22" />
          <ellipse cx="32" cy="32" rx="9" ry="22" />
          <path d="M10 32h44M14 20h36M14 44h36" />
        </>
      );
    case "mountain":
      return (
        <>
          <path d="M5 52 24 20l11 18 8-12 16 26z" />
          <path d="M18 31l6-11 5 8" />
        </>
      );
    case "tree":
      return (
        <>
          <circle cx="32" cy="26" r="17" />
          <path d="M32 43v15M32 50l-8-8M32 46l8-8" />
        </>
      );
    case "planet":
      return (
        <>
          <circle cx="32" cy="32" r="14" />
          <ellipse cx="32" cy="32" rx="27" ry="8" transform="rotate(-22 32 32)" />
        </>
      );
    case "heart":
      return <path d="M32 54C10 38 8 22 18 14c6-4 12-2 14 4 2-6 8-8 14-4 10 8 8 24-14 40z" />;
    case "cell":
      return (
        <>
          <circle cx="32" cy="32" r="23" />
          <circle cx="28" cy="30" r="8" />
          <circle cx="44" cy="42" r="2" fill={color} stroke="none" />
          <circle cx="20" cy="46" r="2" fill={color} stroke="none" />
          <circle cx="45" cy="22" r="2" fill={color} stroke="none" />
        </>
      );
    case "gear":
      return (
        <>
          <circle cx="32" cy="32" r="14" />
          <circle cx="32" cy="32" r="5" />
          <path d="M32 8v8M32 48v8M8 32h8M48 32h8M15 15l6 6M43 43l6 6M49 15l-6 6M21 43l-6 6" />
        </>
      );
    case "computer":
      return (
        <>
          <rect x="8" y="12" width="48" height="32" rx="4" />
          <path d="M22 54h20M32 44v10" />
        </>
      );
    case "code":
      return <path d="M22 18 8 32l14 14M42 18l14 14-14 14M36 12 28 52" />;
    case "scales":
      return (
        <>
          <path d="M32 10v42M20 54h24M10 18h44" />
          <path d="M10 18 4 36h12zM54 18l-6 18h12z" />
          <path d="M4 36a6 6 0 0 0 12 0M48 36a6 6 0 0 0 12 0" />
        </>
      );
    case "scroll":
      return (
        <>
          <path d="M20 10h30v36a8 8 0 0 1-8 8H16a8 8 0 0 0 8-8V14a4 4 0 0 0-4-4z" />
          <path d="M16 54a8 8 0 0 1-8-8v-4h16" />
          <path d="M30 22h12M30 30h12" />
        </>
      );
    case "crown":
      return (
        <>
          <path d="M10 46 7 20l14 12 11-18 11 18 14-12-3 26z" />
          <path d="M10 53h44" />
        </>
      );
    case "coin":
      return (
        <>
          <circle cx="32" cy="32" r="22" />
          <circle cx="32" cy="32" r="14" />
          <path d="M26 32h12M32 26v12" />
        </>
      );
    case "brain":
      return (
        <>
          <path d="M32 12c-6-5-17-1-17 9-6 2-6 13 0 15 0 9 9 13 17 9 8 4 17 0 17-9 6-2 6-13 0-15 0-10-11-14-17-9z" />
          <path d="M32 12v42M22 28c4 0 6 2 6 6M42 28c-4 0-6 2-6 6" />
        </>
      );
    case "thermometer":
      return (
        <>
          <path d="M25 14a7 7 0 0 1 14 0v22a13 13 0 1 1-14 0z" />
          <circle cx="32" cy="46" r="5" fill={color} stroke="none" />
          <path d="M32 20v26" />
        </>
      );
    case "rocket":
      return (
        <>
          <path d="M32 6c9 8 11 22 7 36H25C21 28 23 14 32 6z" />
          <circle cx="32" cy="22" r="4" />
          <path d="M25 34l-9 11 9-3M39 34l9 11-9-3M29 46l3 12 3-12" />
        </>
      );
    case "fire":
      return (
        <>
          <path d="M32 6c3 11 17 17 17 33a17 17 0 0 1-34 0c0-9 5-13 9-18 0 7 4 9 7 5 3-7-2-11 1-20z" />
          <path d="M32 54a7 7 0 0 1-7-7c0-5 4-7 7-12 3 5 7 7 7 12a7 7 0 0 1-7 7z" />
        </>
      );
    case "wind":
      return <path d="M6 24h32a7 7 0 1 0-7-7M6 34h44a7 7 0 1 1-7 7M6 44h22" />;
    case "flag":
      return (
        <>
          <path d="M14 58V8" />
          <path d="M14 10h34l-7 11 7 11H14" />
        </>
      );
    case "castle":
      return (
        <>
          <path d="M8 56V22h9v7h7v-7h16v7h7v-7h9v34z" />
          <path d="M26 56V42a6 6 0 0 1 12 0v14" />
        </>
      );
    default:
      return <circle cx="32" cy="32" r="14" />;
  }
}
