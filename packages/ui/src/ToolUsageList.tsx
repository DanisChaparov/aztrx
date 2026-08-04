"use client";

import { AppWindow, BookOpen, Code2, Sparkles, Terminal, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
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
  Zed: Code2,
  WebStorm: Code2,
  "IntelliJ IDEA": Code2,
  PyCharm: Code2,
  GoLand: Code2,
  CLion: Code2,
  RubyMine: Code2,
  Rider: Code2,
  PhpStorm: Code2,
  DataGrip: Code2,
  Fleet: Code2,
  "Android Studio": Code2,
  Xcode: Code2,
  "Sublime Text": Code2,
  Obsidian: BookOpen,
  Terminal: Terminal,
  iTerm2: Terminal,
  "Windows Terminal": Terminal,
  Warp: Terminal,
  "Claude Code": Sparkles,
  "Codex CLI": Sparkles,
  "Gemini CLI": Sparkles,
  Aider: Sparkles,
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function ToolUsageList({ items, compact = false }: { items: ToolUsageItem[]; compact?: boolean }) {
  if (items.length === 0) {
    if (compact) return null;
    return (
      <p className="font-inter text-sm text-neutral-500">
        No tool activity yet — the desktop widget tracks time in Cursor, Obsidian, Antigravity, and other apps
        during verified sessions.
      </p>
    );
  }

  const maxSeconds = Math.max(...items.map((i) => i.totalSeconds));

  return (
    <div className={compact ? "flex flex-col gap-1.5" : "glass-panel flex flex-col gap-3 p-4"}>
      <ul className="flex flex-col gap-2.5">
        {items.map((item, index) => {
          const Icon = ICONS[item.appName] ?? AppWindow;
          return (
            <motion.li
              key={item.appName}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
            >
              <Icon size={compact ? 12 : 14} className="shrink-0 text-[#60A5FA]" />
              <span className={`flex shrink-0 items-center gap-1.5 truncate font-inter text-sm text-neutral-300 ${compact ? "w-28" : "w-32"}`}>
                {item.appName}
                {isAiAssistedTool(item.appName) && (
                  <span className="shrink-0 rounded-full bg-[#3B82F6]/15 px-1.5 py-0.5 font-jakarta text-[9px] font-bold uppercase tracking-wide text-[#60A5FA]">
                    AI
                  </span>
                )}
              </span>
              {!compact && (
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className="h-full rounded-full bg-[#3B82F6]/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.totalSeconds / maxSeconds) * 100}%` }}
                    transition={{ duration: 0.6, delay: index * 0.05 + 0.1, ease: "easeOut" }}
                  />
                </div>
              )}
              <span className="w-12 shrink-0 text-right font-inter text-xs tabular-nums text-neutral-500">
                {formatDuration(item.totalSeconds)}
              </span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
