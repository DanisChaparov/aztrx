"use client";

import { motion } from "framer-motion";
import { Monitor, Smartphone, Clock, Code2, Sparkles, Terminal, BookOpen, AppWindow, type LucideIcon } from "lucide-react";
import { isAiAssistedTool } from "@focus-forge/core";

export interface DailyScreenTimeItem {
  appName: string;
  trackedTool: string | null;
  isAiAssisted: boolean;
  totalSeconds: number;
  /** Human-readable hour bucket label, e.g. "9 AM", "2 PM" */
  peakHour?: string | null;
}

const APP_ICONS: Record<string, LucideIcon> = {
  Cursor: Code2, "Visual Studio Code": Code2, Windsurf: Code2, Zed: Code2,
  WebStorm: Code2, "IntelliJ IDEA": Code2, PyCharm: Code2, GoLand: Code2,
  CLion: Code2, RubyMine: Code2, Rider: Code2, PhpStorm: Code2,
  DataGrip: Code2, Fleet: Code2, "Android Studio": Code2, Xcode: Code2,
  "Sublime Text": Code2, Obsidian: BookOpen, Terminal: Terminal,
  iTerm2: Terminal, "Windows Terminal": Terminal, Warp: Terminal,
  "Claude Code": Sparkles, "Codex CLI": Sparkles, "Gemini CLI": Sparkles,
  Aider: Sparkles, Antigravity: Sparkles,
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * iPhone Screen Time-style daily tool usage card.
 * Shows total screen time for the day + per-app breakdown with proportional bars.
 * Pure display component — data fetching happens in the parent.
 */
export function DailyScreenTime({
  items,
  dateLabel,
}: {
  items: DailyScreenTimeItem[];
  dateLabel: string;
}) {
  const totalSeconds = items.reduce((sum, i) => sum + i.totalSeconds, 0);
  const maxSeconds = Math.max(...items.map((i) => i.totalSeconds), 1);

  if (items.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center gap-3 p-6 text-center">
        <Monitor size={24} className="text-neutral-600" />
        <div>
          <p className="font-manrope text-sm font-medium text-neutral-400">No screen time data yet</p>
          <p className="mt-1 font-inter text-xs text-neutral-500">
            Keep the desktop app running — it tracks your tool usage throughout the day, like Screen Time for developers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel flex flex-col gap-5 p-5">
      {/* Header — like iPhone's "SCREEN TIME" label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-neutral-500" />
          <span className="font-manrope text-[11px] font-semibold uppercase tracking-widest text-neutral-500">
            Screen Time
          </span>
        </div>
        <span className="font-inter text-xs text-neutral-500">{dateLabel}</span>
      </div>

      {/* Total — big number like iPhone */}
      <div className="flex flex-col items-center gap-1">
        <motion.span
          className="font-instrument-serif text-5xl font-bold text-white tabular-nums"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {formatDuration(totalSeconds)}
        </motion.span>
        <span className="font-inter text-xs text-neutral-500">of tool time today</span>
      </div>

      {/* Per-app bars — like iPhone's most-used list */}
      <div className="flex flex-col gap-3">
        <span className="font-manrope text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
          Most used
        </span>
        <ul className="flex flex-col gap-2.5">
          {items.slice(0, 8).map((item, index) => {
            const displayName = item.trackedTool ?? item.appName;
            const Icon = APP_ICONS[displayName] ?? AppWindow;
            const pct = maxSeconds > 0 ? (item.totalSeconds / maxSeconds) * 100 : 0;
            const aiAssisted = item.trackedTool
              ? isAiAssistedTool(item.trackedTool)
              : item.isAiAssisted;

            return (
              <motion.li
                key={item.appName}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
              >
                {/* Icon */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                  <Icon size={14} className={aiAssisted ? "text-[#8b74ff]" : "text-neutral-400"} />
                </div>

                {/* Name + bar */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate font-inter text-[13px] font-medium text-neutral-200">
                      {displayName}
                    </span>
                    <span className="ml-2 shrink-0 font-inter text-[13px] tabular-nums text-neutral-500">
                      {formatDuration(item.totalSeconds)}
                    </span>
                  </div>
                  {/* Bar */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: aiAssisted
                          ? "linear-gradient(90deg, #6744FF, #8b74ff)"
                          : "linear-gradient(90deg, #3B3B4D, #5A5A72)",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: index * 0.04 + 0.1, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </div>

      {/* AI vs non-AI split — quick stat */}
      <div className="flex gap-4 rounded-xl bg-white/[0.02] p-3">
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <Sparkles size={11} className="text-[#8b74ff]" />
            <span className="font-inter text-[11px] text-neutral-500">AI tools</span>
          </div>
          <span className="font-manrope text-sm font-semibold text-white tabular-nums">
            {formatDuration(items.filter((i) => (i.trackedTool ? isAiAssistedTool(i.trackedTool) : i.isAiAssisted)).reduce((s, i) => s + i.totalSeconds, 0))}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <Monitor size={11} className="text-neutral-500" />
            <span className="font-inter text-[11px] text-neutral-500">Editors & terminals</span>
          </div>
          <span className="font-manrope text-sm font-semibold text-white tabular-nums">
            {formatDuration(items.filter((i) => !(i.trackedTool ? isAiAssistedTool(i.trackedTool) : i.isAiAssisted)).reduce((s, i) => s + i.totalSeconds, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
