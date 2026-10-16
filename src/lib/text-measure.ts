/**
 * Browser text measurement for the layout engine. Waits (briefly) for the
 * handwriting font, then measures with a canvas so boxes hug the real glyph widths.
 * Safe to call on the server or when canvas is unavailable: layout falls back to estimates.
 */
import { setTextMeasurer } from "./layout-metrics.ts";

const FAMILY = '"Caveat", "Segoe Script", cursive';
let installing: Promise<void> | null = null;

export function installBrowserMeasurer(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  installing ??= (async () => {
    try {
      const fonts = document.fonts;
      if (fonts?.load) {
        await Promise.race([
          Promise.all(["500 18px Caveat", "600 26px Caveat", "700 34px Caveat"].map((f) => fonts.load(f))),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]);
      }
    } catch {
      /* the font may simply be blocked; measure with the fallback */
    }
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return;
    const cache = new Map<string, number>();
    setTextMeasurer((text, px, weight) => {
      const key = `${weight}|${px}|${text}`;
      let w = cache.get(key);
      if (w === undefined) {
        ctx.font = `${weight} ${px}px ${FAMILY}`;
        w = ctx.measureText(text).width;
        if (cache.size > 6000) cache.clear();
        cache.set(key, w);
      }
      return w;
    });
  })();
  return installing;
}
