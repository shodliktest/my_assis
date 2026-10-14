import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { Crosshair, Minus, Plus, RotateCcw } from "lucide-react";
import { TutorPencil, type PencilMood } from "@/components/tutor-pencil";
import { BoardItemView } from "@/lib/board-items";
import type { BoardTheme } from "@/lib/board-theme";
import { PAGE, type DrawItem, type PencilColorId } from "@/lib/lesson";

const HOLE_SPACING = 240;

/**
 * The board. It has no height limit: `page.h` follows the content, and the
 * scroll area simply gets longer. The camera follows the pencil until the reader
 * scrolls away; the "Kuzatish" button hands control back.
 */
export function NotebookBoard({
  items,
  drawingId,
  drawProgress,
  character,
  mood,
  speaking,
  colorId,
  onRecolor,
  planning,
  empty,
  page = PAGE,
  theme = "plain",
}: {
  items: DrawItem[];
  drawingId: string | null;
  drawProgress: number;
  character: { x: number; y: number };
  mood: PencilMood;
  speaking: boolean;
  colorId: PencilColorId;
  onRecolor: () => void;
  planning: boolean;
  empty?: boolean;
  page?: { w: number; h: number };
  theme?: BoardTheme;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [viewH, setViewH] = useState(0);
  const [follow, setFollow] = useState(true);
  const userZoomed = useRef(false);
  const programmatic = useRef(false);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const clampZoom = useCallback((value: number) => Math.min(2.4, Math.max(0.5, value)), []);
  const fitZoom = useCallback(
    (el: HTMLElement) => clampZoom(el.clientWidth / page.w),
    [clampZoom, page.w],
  );

  // Fit the board's width to the screen; the length is unlimited and scrolls.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const apply = () => {
      setViewH(el.clientHeight);
      if (!userZoomed.current) setZoom(fitZoom(el));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitZoom]);

  // A new question: hand the camera back to the pencil.
  useEffect(() => {
    if (planning) setFollow(true);
  }, [planning]);

  // Camera: ease the scroll position toward the pencil.
  useEffect(() => {
    if (!follow) return;
    const el = scrollerRef.current;
    if (!el) return;
    const maxTop = Math.max(0, el.scrollHeight - el.clientHeight);
    const target = Math.min(maxTop, Math.max(0, (character.y + 100) * zoom - el.clientHeight * 0.42));
    const diff = target - el.scrollTop;
    if (Math.abs(diff) < 2) return;
    programmatic.current = true;
    el.scrollTop += diff * (Math.abs(diff) > el.clientHeight ? 0.5 : 0.2);
    requestAnimationFrame(() => {
      programmatic.current = false;
    });
  }, [character.x, character.y, zoom, follow, page.h]);

  function stopFollowing() {
    if (!programmatic.current) setFollow(false);
  }

  function onWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      userZoomed.current = true;
      setZoom((z) => clampZoom(z * (event.deltaY > 0 ? 0.92 : 1.08)));
      return;
    }
    stopFollowing();
  }

  function onTouchStart(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) {
      const [a, b] = [event.touches[0], event.touches[1]];
      pinchRef.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), zoom };
    }
  }

  function onTouchMove(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2 && pinchRef.current) {
      event.preventDefault();
      const [a, b] = [event.touches[0], event.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      userZoomed.current = true;
      setZoom(clampZoom(pinchRef.current.zoom * (dist / pinchRef.current.dist)));
      return;
    }
    if (event.touches.length === 1) stopFollowing();
  }

  function onTouchEnd() {
    pinchRef.current = null;
  }

  const drawn = items.filter((item) => item.id !== drawingId);
  const current = items.find((item) => item.id === drawingId);

  // The paper always fills the screen, and grows past it as the lesson does.
  const innerH = Math.max(page.h, viewH / zoom);
  const holes = theme === "lines" ? Math.min(400, Math.floor(innerH / HOLE_SPACING)) : 0;
  const ink = (item: DrawItem, drawing: boolean, progress: number) => {
    const node: ReactNode = <BoardItemView item={item} drawing={drawing} progress={progress} />;
    // On the chalkboard each item is colour-inverted on its own small layer, so the
    // filter never has to cover the (unbounded) whole board.
    return theme === "chalk" ? (
      <div key={item.id} className="chalk-ink">
        {node}
      </div>
    ) : (
      <Keyed key={item.id}>{node}</Keyed>
    );
  };

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col" aria-label="O'quv daftari">
      <div className="zoom-dock" role="group" aria-label="Daftarni kattalashtirish">
        <button
          type="button"
          aria-label="Kichiklashtirish"
          onClick={() => {
            userZoomed.current = true;
            setZoom((z) => clampZoom(z / 1.15));
          }}
        >
          <Minus />
        </button>
        <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          aria-label="Kattalashtirish"
          onClick={() => {
            userZoomed.current = true;
            setZoom((z) => clampZoom(z * 1.15));
          }}
        >
          <Plus />
        </button>
        <button
          type="button"
          aria-label="Moslashtirish"
          onClick={() => {
            const el = scrollerRef.current;
            if (!el) return;
            userZoomed.current = false;
            setZoom(fitZoom(el));
          }}
        >
          <RotateCcw />
        </button>
      </div>

      {!follow && drawingId !== null ? (
        <button type="button" className="follow-btn" onClick={() => setFollow(true)}>
          <Crosshair aria-hidden="true" />
          Kuzatish
        </button>
      ) : null}

      <div
        ref={scrollerRef}
        className="notebook-scroll relative min-h-0 flex-1 overflow-auto"
        data-theme={theme}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="notebook-page relative" style={{ width: page.w * zoom, height: innerH * zoom }}>
          <div
            className="notebook-inner absolute left-0 top-0 origin-top-left"
            data-theme={theme}
            style={{ width: page.w, height: innerH, transform: `scale(${zoom})` }}
          >
            {theme === "lines" ? (
              <>
                <div className="notebook-gutter pointer-events-none absolute inset-y-0 left-0 w-12" />
                <div className="pointer-events-none absolute inset-y-0 left-12 w-px bg-margin/70" />
                {Array.from({ length: holes }).map((_, i) => (
                  <span
                    key={i}
                    className="pointer-events-none absolute left-3.5 size-3 rounded-full bg-border shadow-[inset_0_1px_2px_rgba(28,25,23,0.18)]"
                    style={{ top: 80 + i * HOLE_SPACING }}
                  />
                ))}
              </>
            ) : null}

            {planning && items.length === 0 ? (
              <div className="absolute inset-x-0 top-40 grid place-items-center">
                <p className="font-hand text-3xl text-muted">Doskani rejalashtiryapman…</p>
              </div>
            ) : null}

            {empty && !planning ? (
              <div className="absolute inset-x-16 top-36 text-center">
                <p className="font-hand text-4xl text-muted">Savolingizni yozing…</p>
                <p className="mt-4 font-hand text-2xl text-muted/80">
                  Qalam faqat so‘ragan narsangizni doskada tushuntiradi
                </p>
              </div>
            ) : null}

            {drawn.map((item) => ink(item, false, 1))}
            {current ? ink(current, true, drawProgress) : null}

            <TutorPencil
              x={character.x}
              y={character.y}
              mood={mood}
              colorId={colorId}
              speaking={speaking}
              onRecolor={onRecolor}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Keeps a React key on a child without adding a DOM element. */
function Keyed({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
