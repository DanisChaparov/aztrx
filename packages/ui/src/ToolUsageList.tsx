import { AppWindow, BookOpen, Code2, Sparkles, Terminal, type LucideIcon } from "lucide-react";
import { isAiAssistedTool } from "@focus-forge/core";

export interface ToolUsageItem {
  appName: string;
  totalSeconds: number;
}

const ICONS: Record<string, LucideIcon> = {
  Cursor: Code2,
  Antigravity: Sparkles,
  "Visual Studio Code": Code2,
  Windsurf: Code2,
  WebStorm: Code2,
  "IntelliJ IDEA": Code2,
  PyCharm: Code2,
  "Android Studio": Code2,
  Xcode: Code2,
  "Sublime Text": Code2,
  Obsidian: BookOpen,
  Terminal: Terminal,
  iTerm2: Terminal,
  "Windows Terminal": Terminal,
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function ToolUsageList({ items }: { items: ToolUsageItem[] }) {
  if (items.length === 0) {
    return (
      <p className="font-inter text-sm text-neutral-500">
        No tool activity yet — the desktop widget tracks time in Cursor, Obsidian, Antigravity, and other apps
        during verified sessions.
      </p>
    );
  }

  const maxSeconds = Math.max(...items.map((i) => i.totalSeconds));

  return (
    <div className="glass-panel flex flex-col gap-3 p-4">
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => {
          const Icon = ICONS[item.appName] ?? AppWindow;
          return (
            <li key={item.appName} className="flex items-center gap-3">
              <Icon size={14} className="shrink-0 text-[#5ed29c]" />
              <span className="flex w-32 shrink-0 items-center gap-1.5 truncate font-inter text-sm text-neutral-300">
                {item.appName}
                {isAiAssistedTool(item.appName) && (
                  <span className="shrink-0 rounded-full bg-[#5ed29c]/15 px-1.5 py-0.5 font-jakarta text-[9px] font-bold uppercase tracking-wide text-[#5ed29c]">
                    AI
                  </span>
                )}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-[#5ed29c]/60"
                  style={{ width: `${(item.totalSeconds / maxSeconds) * 100}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right font-inter text-xs tabular-nums text-neutral-500">
                {formatDuration(item.totalSeconds)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
