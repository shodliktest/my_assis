import installPageTemplate from "../../scripts/install-page.html?raw";
import { acceptsHtml, isDocumentPath, isInstallQuery, renderInstallPageHtml, renderWebManifest } from "../../scripts/pwa-shared.mjs";

export default async function pwaMiddleware(event: any, next: () => unknown | Promise<unknown>): Promise<unknown> {
  const method = String(event.req.method ?? "GET").toUpperCase();
  if (method !== "GET") return next();
  const path = event.url.pathname;
  const url = path + event.url.search;
  if (path === "/manifest.webmanifest" || path === "/manifest.json") {
    return new Response(renderWebManifest(), { headers: { "content-type": "application/manifest+json; charset=utf-8", "cache-control": "no-cache" } });
  }
  if (isInstallQuery(url) && isDocumentPath(path) && acceptsHtml(event.req.headers.get("accept"))) {
    return new Response(renderInstallPageHtml(installPageTemplate, { url }), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
  }
  return next();
}
