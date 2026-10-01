import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { acceptsHtml, isDocumentPath, isInstallQuery, renderInstallPageHtml, renderWebManifest } from "./pwa-shared.mjs";

const INSTALL_PAGE_PATH = join(dirname(fileURLToPath(import.meta.url)), "install-page.html");

function send(res, status, type, body) {
  const data = Buffer.from(body, "utf8");
  res.statusCode = status;
  res.setHeader("content-type", type);
  res.setHeader("cache-control", "no-cache");
  res.setHeader("content-length", String(data.byteLength));
  res.end(data);
}

function servePwa(middlewares) {
  middlewares.use((req, res, next) => {
    const rawUrl = req.url ?? "";
    const path = rawUrl.split("?", 1)[0] ?? "";
    if ((req.method ?? "GET").toUpperCase() !== "GET") return next();
    if (path === "/manifest.webmanifest" || path === "/manifest.json") {
      send(res, 200, "application/manifest+json; charset=utf-8", renderWebManifest());
      return;
    }
    if (isInstallQuery(rawUrl) && isDocumentPath(path) && acceptsHtml(req.headers.accept)) {
      const template = readFileSync(INSTALL_PAGE_PATH, "utf8");
      send(res, 200, "text/html; charset=utf-8", renderInstallPageHtml(template, { url: rawUrl }));
      return;
    }
    next();
  });
}

export function pwaPlugin() {
  return {
    name: "daftar:pwa",
    configureServer(server) { servePwa(server.middlewares); },
    configurePreviewServer(server) { servePwa(server.middlewares); },
  };
}
