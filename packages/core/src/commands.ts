// The assistant only ever sends these ids/enum values across the wire for the
// bounded command paths — never raw shell text. The desktop app maps id ->
// actual command locally, so the model itself can't inject arbitrary strings
// into the "safe" paths. Only the explicit run_shell path carries free text,
// and that one requires local confirmation before it runs (see apps/desktop).

export const LAUNCHABLE_APPS = [
  "Cursor",
  "Visual Studio Code",
  "Antigravity",
  "Obsidian",
  "Windsurf",
  "Terminal",
] as const;
export type LaunchableApp = (typeof LAUNCHABLE_APPS)[number];

export interface DevCommandDef {
  id: string;
  label: string;
}

export const DEV_COMMAND_ALLOWLIST: DevCommandDef[] = [
  { id: "git_status", label: "git status" },
  { id: "git_pull", label: "git pull" },
  { id: "npm_install", label: "npm install" },
  { id: "npm_test", label: "npm test" },
  { id: "npm_build", label: "npm run build" },
];

export const DEV_COMMAND_IDS = DEV_COMMAND_ALLOWLIST.map((c) => c.id);
