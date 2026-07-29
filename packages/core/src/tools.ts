export interface TrackedTool {
  name: string;
  aiAssisted: boolean;
}

// Canonical tool identities — matching returns this exact `name`, not
// whatever the OS reports, so usage buckets stay stable across platforms.
// `aiAssisted` marks editors that are themselves AI coding assistants
// (as opposed to a plain editor that merely has AI plugins we can't detect).
export const TRACKED_TOOLS: TrackedTool[] = [
  { name: "Cursor", aiAssisted: true },
  { name: "Antigravity", aiAssisted: true },
  { name: "Windsurf", aiAssisted: true },
  { name: "Zed", aiAssisted: true },
  { name: "Visual Studio Code", aiAssisted: false },
  { name: "Obsidian", aiAssisted: false },
  { name: "WebStorm", aiAssisted: false },
  { name: "IntelliJ IDEA", aiAssisted: false },
  { name: "PyCharm", aiAssisted: false },
  { name: "GoLand", aiAssisted: false },
  { name: "CLion", aiAssisted: false },
  { name: "RubyMine", aiAssisted: false },
  { name: "Rider", aiAssisted: false },
  { name: "PhpStorm", aiAssisted: false },
  { name: "DataGrip", aiAssisted: false },
  { name: "Fleet", aiAssisted: false },
  { name: "Android Studio", aiAssisted: false },
  { name: "Xcode", aiAssisted: false },
  { name: "Sublime Text", aiAssisted: false },
  { name: "Warp", aiAssisted: false },
  { name: "iTerm2", aiAssisted: false },
  { name: "Windows Terminal", aiAssisted: false },
  { name: "Terminal", aiAssisted: false },
];

// Terminal apps whose window *title* (not just process name) is where AI-CLI
// usage actually shows up — e.g. a "Windows Terminal" process running `claude`
// or `codex` is meaningfully different from one running `npm test`, but
// active-window APIs only report the process name unless we also read the title.
const TERMINAL_APP_NAMES = new Set(["Terminal", "Windows Terminal", "iTerm2", "Warp"]);
const AI_CLI_TITLE_MARKERS: { marker: string; name: string }[] = [
  { marker: "claude", name: "Claude Code" },
  { marker: "codex", name: "Codex CLI" },
  { marker: "gemini", name: "Gemini CLI" },
  { marker: "aider", name: "Aider" },
];

export function matchTrackedTool(
  appName: string,
  tools: TrackedTool[] = TRACKED_TOOLS,
  windowTitle?: string | null
): TrackedTool | null {
  const normalized = appName.toLowerCase();
  // "Code" alone is how VS Code's process often reports itself.
  if (normalized === "code") return tools.find((t) => t.name === "Visual Studio Code") ?? null;

  const matched = tools.find((tool) => normalized.includes(tool.name.toLowerCase())) ?? null;

  if (matched && TERMINAL_APP_NAMES.has(matched.name) && windowTitle) {
    const titleLower = windowTitle.toLowerCase();
    const aiCli = AI_CLI_TITLE_MARKERS.find((m) => titleLower.includes(m.marker));
    if (aiCli) return { name: aiCli.name, aiAssisted: true };
  }

  return matched;
}

export function isAiAssistedTool(appName: string, windowTitle?: string | null): boolean {
  return matchTrackedTool(appName, TRACKED_TOOLS, windowTitle)?.aiAssisted ?? false;
}
