import { build, context } from "esbuild";
import { readFileSync, existsSync } from "node:fs";

const watch = process.argv.includes("--watch");

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

const options = {
  entryPoints: {
    background: "src/background.ts",
    popup: "src/popup.ts",
    blocked: "src/blocked.ts",
  },
  bundle: true,
  outdir: "public",
  format: "iife",
  target: "chrome110",
  sourcemap: true,
  logLevel: "info",
  define,
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("Watching for changes...");
} else {
  await build(options);
}
