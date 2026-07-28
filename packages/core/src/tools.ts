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
  { name: "Visual Studio Code", aiAssisted: false },
  { name: "Obsidian", aiAssisted: false },
  { name: "WebStorm", aiAssisted: false },
  { name: "IntelliJ IDEA", aiAssisted: false },
  { name: "PyCharm", aiAssisted: false },
  { name: "Android Studio", aiAssisted: false },
  { name: "Xcode", aiAssisted: false },
  { name: "Sublime Text", aiAssisted: false },
  { name: "iTerm2", aiAssisted: false },
  { name: "Windows Terminal", aiAssisted: false },
  { name: "Terminal", aiAssisted: false },
];

export function matchTrackedTool(appName: string, tools: TrackedTool[] = TRACKED_TOOLS): TrackedTool | null {
  const normalized = appName.toLowerCase();
  // "Code" alone is how VS Code's process often reports itself.
  if (normalized === "code") return tools.find((t) => t.name === "Visual Studio Code") ?? null;
  return tools.find((tool) => normalized.includes(tool.name.toLowerCase())) ?? null;
}

export function isAiAssistedTool(appName: string): boolean {
  return matchTrackedTool(appName)?.aiAssisted ?? false;
}
