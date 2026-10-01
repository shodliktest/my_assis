import { useCallback, useLayoutEffect, useRef, useState, type WheelEvent as ReactWheelEvent } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { TutorPencil, type PencilMood } from "@/components/tutor-pencil";
import { BoardItemView } from "@/lib/board-items";
import { PAGE, type DrawItem, type PencilColorId } from "@/lib/lesson";

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
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);

  const clampZoom = useCallback((value: number) => {
    return Math.min(2.8, Math.max(0.28, value));  // 28%..280% — videodagidek uzoqdan ko'rinadi
  }, []);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const apply = () => {
      // Width-first fit (like video): full notebook width visible; height scrolls.
      // Min zoom 28% so long pages still overview-able.
      const byW = el.clientWidth / page.w;
      const byH = el.clientHeight / Math.min(page.h, page.w * 1.35);
      setZoom(clampZoom(Math.min(byW, byH, 1)));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [clampZoom, page.w, page.h]);

  function onWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.92 : 1.08;
    setZoom((z) => clampZoom(z * delta));
  }

  function onTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) {
      const [a, b] = [event.touches[0], event.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { dist, zoom };
    }
  }

  function onTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2 || !pinchRef.current) return;
    event.preventDefault();
    const [a, b] = [event.touches[0], event.touches[1]];
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const ratio = dist / pinchRef.current.dist;
    setZoom(clampZoom(pinchRef.current.zoom * ratio));
  }

  function onTouchEnd() {
    pinchRef.current = null;
  }

  const drawn = items.filter((item) => item.id !== drawingId);
  const current = items.find((item) => item.id === drawingId);

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col" aria-label="O'quv daftari">
      <div className="zoom-dock" role="group" aria-label="Daftarni kattalashtirish">
        <button type="button" aria-label="Kichiklashtirish" onClick={() => setZoom((z) => clampZoom(z / 1.15))}>
          <Minus />
        </button>
        <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
        <button type="button" aria-label="Kattalashtirish" onClick={() => setZoom((z) => clampZoom(z * 1.15))}>
          <Plus />
        </button>
        <button
          type="button"
          aria-label="Moslashtirish"
          onClick={() => {
            const el = scrollerRef.current;
            if (!el) return;
            setZoom(clampZoom(Math.min(el.clientWidth / page.w, el.clientHeight / page.h)));
          }}
        >
          <RotateCcw />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="notebook-scroll relative min-h-0 flex-1 overflow-auto"
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="notebook-page relative"
          style={{
            width: page.w * zoom,
            height: page.h * zoom,
          }}
        >
          <div
            className="notebook-inner absolute left-0 top-0 origin-top-left"
            style={{
              width: page.w,
              height: page.h,
              transform: `scale(${zoom})`,
            }}
          >
            <div className="notebook-gutter pointer-events-none absolute inset-y-0 left-0 w-12" />
            <div className="pointer-events-none absolute inset-y-0 left-12 w-px bg-margin/70" />
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="pointer-events-none absolute left-3.5 size-3 rounded-full bg-border shadow-[inset_0_1px_2px_rgba(28,25,23,0.18)]"
                style={{ top: 80 + i * 240 }}
              />
            ))}

            {planning ? (
              <div className="absolute inset-0 grid place-items-center">
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

            {drawn.map((item) => (
              <BoardItemView key={item.id} item={item} drawing={false} progress={1} />
            ))}
            {current ? (
              <BoardItemView key={current.id} item={current} drawing progress={drawProgress} />
            ) : null}

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
