import { build } from "esbuild";
import { readFileSync, existsSync } from "node:fs";

function loadEnv(path) {
  const env = {};
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = { ...loadEnv(".env.local.example"), ...loadEnv(".env.local") };
const define = {
  "process.env.SUPABASE_URL": JSON.stringify(env.SUPABASE_URL ?? ""),
  "process.env.SUPABASE_ANON_KEY": JSON.stringify(env.SUPABASE_ANON_KEY ?? ""),
};

await build({
  entryPoints: { main: "src/main.ts", preload: "src/preload.ts", mcpServer: "src/mcpServer.ts" },
  bundle: true,
  outdir: "dist",
  format: "cjs",
  platform: "node",
  target: "node20",
  // active-win is pure ESM ("type": "module") and spawns a helper binary via
  // a path relative to its own package folder — bundling it would break both
  // the ESM require() interop and that relative path, so it stays external
  // and gets loaded with a real dynamic import() at runtime instead.
  // kokoro-js (and its @huggingface/transformers / onnxruntime dependencies)
  // is the same story — ESM, and it resolves its own WASM/ONNX runtime assets
  // via paths relative to its package folder, which bundling would break.
  external: [
    "electron",
    "bufferutil",
    "utf-8-validate",
    "active-win",
    "kokoro-js",
    "@huggingface/transformers",
    "onnxruntime-node",
    "onnxruntime-common",
    "sharp",
  ],
  sourcemap: true,
  logLevel: "info",
  define,
});

// The renderer is no longer bundled — the desktop app now loads the full
// Next.js web app (localhost:3000 in dev, or the deployed URL in production)
// instead of the old 300×380 widget. The web app handles all UI.
