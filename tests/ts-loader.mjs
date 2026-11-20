// Node-Testlader: löst Expo-Importe ("@/…", ohne Dateiendung, JSON) wie Metro auf.
// Nutzung: node --import ./tests/ts-loader.mjs --experimental-strip-types --test tests/*.test.mjs
import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";

const FRONTEND = path.resolve(fileURLToPath(import.meta.url), "../../frontend");
// TypeScript aus dem Frontend transpiliert reine Typ-Importe weg (wie Metro/Babel)
const ts = createRequire(import.meta.url)(path.join(FRONTEND, "node_modules/typescript"));
const EXT = ["", ".ts", ".tsx", ".js", "/index.ts", "/index.tsx"];

registerHooks({
  resolve(spec, ctx, next) {
    let base = null;
    if (spec.startsWith("@/")) base = path.join(FRONTEND, spec.slice(2));
    else if ((spec.startsWith("./") || spec.startsWith("../")) && ctx.parentURL?.startsWith("file:")) base = path.resolve(path.dirname(fileURLToPath(ctx.parentURL)), spec);
    if (base) for (const e of EXT) if (existsSync(base + e) && !existsSync(base + e + "/")) return { url: pathToFileURL(base + e).href, shortCircuit: true };
    return next(spec, ctx);
  },
  load(url, ctx, next) {
    if (url.endsWith(".json")) return { format: "module", source: "export default " + readFileSync(fileURLToPath(url), "utf8"), shortCircuit: true };
    if (/\.(png|jpe?g|webp|mp3|mp4)$/.test(url)) return { format: "module", source: "export default 1", shortCircuit: true };
    if (/\.tsx?$/.test(url) && url.includes("/frontend/")) {
      const out = ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } });
      return { format: "module", source: out.outputText, shortCircuit: true };
    }
    return next(url, ctx);
  },
});
