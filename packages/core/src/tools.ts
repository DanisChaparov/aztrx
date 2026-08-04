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
  // Synthesized by matchTrackedTool below when a terminal's window title
  // reveals an AI CLI running inside it. Also listed here directly so later
  // by-name-only lookups (e.g. summarizing already-aggregated usage, where
  // the original window title is long gone) still resolve correctly.
  { name: "Claude Code", aiAssisted: true },
  { name: "Codex CLI", aiAssisted: true },
  { name: "Gemini CLI", aiAssisted: true },
  { name: "Aider", aiAssisted: true },
  { name: "Cline", aiAssisted: true },
  { name: "Roo Code", aiAssisted: true },
  { name: "Continue", aiAssisted: true },
  { name: "Cody", aiAssisted: true },
  { name: "GitHub Copilot", aiAssisted: true },
  // Productivity tools that devs spend real time in — tracked for
  // richer tool-usage breakdowns even though they aren't IDEs.
  { name: "Notion", aiAssisted: false },
  { name: "Linear", aiAssisted: false },
  { name: "Figma", aiAssisted: false },
  { name: "Slack", aiAssisted: false },
  { name: "Discord", aiAssisted: false },
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
  { marker: "cline", name: "Cline" },
  { marker: "roo code", name: "Roo Code" },
  { marker: "continue", name: "Continue" },
  { marker: "cody", name: "Cody" },
  { marker: "copilot", name: "GitHub Copilot" },
  { marker: "windsurf", name: "Windsurf" },
  { marker: "cursor", name: "Cursor" },
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

// Windows process image names for "is this tool running at all right now"
// checks (via tasklist), separate from the friendly names active-win reports
// for the *focused* window — a background/unfocused app never shows up there.
// JetBrains Toolbox launchers follow a well-documented "<product>64.exe"
// pattern (high confidence); a few newer apps (Antigravity, Zed, Warp on
// Windows) are best-effort guesses that may need correcting against a real
// install — a wrong name here just means that one tool won't be detected as
// running, not a false positive.
export const TRACKED_TOOL_PROCESS_NAMES: Record<string, string> = {
  Cursor: "Cursor.exe",
  "Visual Studio Code": "Code.exe",
  Antigravity: "Antigravity.exe",
  Windsurf: "Windsurf.exe",
  Zed: "Zed.exe",
  WebStorm: "webstorm64.exe",
  "IntelliJ IDEA": "idea64.exe",
  PyCharm: "pycharm64.exe",
  GoLand: "goland64.exe",
  CLion: "clion64.exe",
  RubyMine: "rubymine64.exe",
  Rider: "rider64.exe",
  PhpStorm: "phpstorm64.exe",
  DataGrip: "datagrip64.exe",
  Fleet: "Fleet.exe",
  "Android Studio": "studio64.exe",
  "Sublime Text": "sublime_text.exe",
  Warp: "Warp.exe",
  "Windows Terminal": "WindowsTerminal.exe",
  Obsidian: "Obsidian.exe",
  Notion: "Notion.exe",
  Linear: "Linear.exe",
  Figma: "Figma.exe",
  Slack: "Slack.exe",
  Discord: "Discord.exe",
};
