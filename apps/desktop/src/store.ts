import { app } from "electron";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Plain JSON file in the app's userData dir. Good enough for a local desktop
// widget's own session token; a follow-up could move this to the OS keychain
// (keytar / safeStorage) before this ships to real users.
//
// Factored as `createFileStorageAdapter(dir)` (not a hardcoded `app.getPath`
// call) so the standalone MCP server process — a plain Node script spawned by
// the `claude` CLI, not run via the `electron` binary — can share the exact
// same session file without depending on Electron's `app` module, which
// isn't available outside an Electron-launched process.
function storePath(dir: string): string {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return join(dir, "session-store.json");
}

function readAll(dir: string): Record<string, string> {
  const path = storePath(dir);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return {};
  }
}

function writeAll(dir: string, data: Record<string, string>): void {
  writeFileSync(storePath(dir), JSON.stringify(data), "utf-8");
}

export function createFileStorageAdapter(dir: string) {
  return {
    getItem(key: string): string | null {
      return readAll(dir)[key] ?? null;
    },
    setItem(key: string, value: string): void {
      const data = readAll(dir);
      data[key] = value;
      writeAll(dir, data);
    },
    removeItem(key: string): void {
      const data = readAll(dir);
      delete data[key];
      writeAll(dir, data);
    },
  };
}

// Lazy — `app.getPath` must not run at module-import time. The standalone
// mcpServer.ts entry point imports `createFileStorageAdapter` from this same
// file (for its own, differently-sourced directory) without ever running
// inside Electron, so nothing here can eagerly touch `electron`'s `app`.
export function fileStorageAdapter() {
  return createFileStorageAdapter(app.getPath("userData"));
}
