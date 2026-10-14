import { useEffect, useRef, useState } from "react";
import { Check, LayoutGrid } from "lucide-react";
import { BOARD_THEMES, type BoardTheme } from "@/lib/board-theme";
import { cn } from "@/lib/utils";

/** Header button that opens the board-background picker: Toza, Nuqtali, Katak, Chiziqli, Doska. */
export function BoardThemeMenu({
  theme,
  onChange,
}: {
  theme: BoardTheme;
  onChange: (next: BoardTheme) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="theme-menu">
      <button
        type="button"
        className="icon-btn"
        aria-label="Doska foni"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <LayoutGrid aria-hidden="true" />
      </button>
      {open ? (
        <div className="theme-popover" role="menu" aria-label="Doska foni">
          {BOARD_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitemradio"
              aria-checked={theme === t.id}
              className={cn("theme-option", theme === t.id && "is-on")}
              onClick={() => {
                onChange(t.id);
                setOpen(false);
              }}
            >
              <span className={cn("theme-swatch", `swatch-${t.id}`)}>
                {theme === t.id ? <Check aria-hidden="true" /> : null}
                {t.id === "chalk" ? <b aria-hidden="true">Aa</b> : null}
              </span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
