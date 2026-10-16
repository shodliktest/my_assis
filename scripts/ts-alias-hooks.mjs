// Node module-customization hook used by tests only: resolves the app's "@/..." import
// alias (see tsconfig paths) to files under src/, so modules that use the alias can be
// unit-tested with plain `node --experimental-strip-types --test`.
//
// Usage (inside a test file, before importing the module under test):
//   register("../../scripts/ts-alias-hooks.mjs", { parentURL: import.meta.url, data: { srcDir } });

import path from "node:path";
import { pathToFileURL } from "node:url";

let srcDir = "";

export function initialize(data) {
  srcDir = data?.srcDir ?? "";
}

export function resolve(specifier, context, nextResolve) {
  if (srcDir && specifier.startsWith("@/")) {
    const rest = specifier.slice(2);
    const file = path.extname(rest) ? rest : `${rest}.ts`;
    return nextResolve(pathToFileURL(path.join(srcDir, file)).href, context);
  }
  return nextResolve(specifier, context);
}
