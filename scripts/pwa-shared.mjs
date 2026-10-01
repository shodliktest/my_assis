export const DEFAULT_APP_NAME = "Daftar";

export function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function appNameFromEnv() {
  return String(process.env.VITE_APP_NAME || DEFAULT_APP_NAME).trim() || DEFAULT_APP_NAME;
}

export function isInstallQuery(url) {
  const query = String(url ?? "").split("?", 2)[1] ?? "";
  const params = new URLSearchParams(query);
  const install = params.get("install");
  return install === "1" || install === "true";
}

export function isDocumentPath(pathname) {
  const path = String(pathname ?? "");
  return !path.startsWith("/api/") && !path.startsWith("/@") && !path.startsWith("/node_modules") && !/\.[a-z0-9]+$/i.test(path);
}

export function acceptsHtml(accept) {
  const value = String(accept ?? "");
  return value === "" || value.includes("text/html") || value.includes("*/*");
}

export function stripInstallParams(url) {
  const [path = "/", query = ""] = String(url ?? "/").split("?", 2);
  const params = new URLSearchParams(query);
  params.delete("install");
  const rest = params.toString();
  return rest ? `${path}?${rest}` : path;
}

export function renderInstallPageHtml(template, { url = "/" } = {}) {
  const appName = htmlEscape(appNameFromEnv());
  return String(template)
    .replaceAll("{{APP_NAME}}", appName)
    .replaceAll("{{APP_URL}}", htmlEscape(stripInstallParams(url)));
}

export function renderWebManifest() {
  const name = appNameFromEnv();
  return JSON.stringify({
    name,
    short_name: name,
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f4ed",
    theme_color: "#0F6B63",
    icons: [
      { src: "/pwa/icon-180.png", sizes: "180x180", type: "image/png", purpose: "any maskable" },
    ],
  }, null, 2);
}
