"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Monitor,
  Smartphone,
} from "lucide-react";
import { isAiAssistedTool } from "@focus-forge/core";

export interface HourlyBucketItem {
  hour: number;
  appName: string;
  trackedTool: string | null;
  isAiAssisted: boolean;
  secondsFocused: number;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function appColor(appName: string, trackedTool: string | null, isAi: boolean, index: number): string {
  if (isAi) {
    const aiColors = ["#3B82F6", "#60A5FA", "#7C3AED", "#A78BFA", "#6D28D9"];
    return aiColors[index % aiColors.length];
  }
  const colors = ["#3B3B4D", "#5A5A72", "#4A4A5E", "#6B6B80", "#2D2D3D"];
  return colors[index % colors.length];
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * iPhone Screen Time detail view — hourly table with day navigation.
 * Shows every tool used each hour, with tap-to-expand row detail.
 */
export function ScreenTimeDetail({
  dateLabel,
  hours,
  onPrevDay,
  onNextDay,
  canGoNext,
}: {
  dateLabel: string;
  hours: HourlyBucketItem[];
  onPrevDay: () => void;
  onNextDay: () => void;
  canGoNext: boolean;
}) {
  const [expandedHour, setExpandedHour] = useState<number | null>(null);

  // Group by hour
  const byHour = new Map<number, HourlyBucketItem[]>();
  for (const item of hours) {
    const list = byHour.get(item.hour) ?? [];
    list.push(item);
    byHour.set(item.hour, list);
  }

  const totalSeconds = hours.reduce((s, i) => s + i.secondsFocused, 0);
  const maxHourlySeconds = Math.max(
    ...HOURS.map((h) => (byHour.get(h) ?? []).reduce((s, i) => s + i.secondsFocused, 0)),
    1
  );

  return (
    <div className="glass-panel flex flex-col gap-5 p-5">
      {/* ── Day selector ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevDay}
          className="flex items-center gap-1 rounded-lg px-2 py-1 font-inter text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-manrope text-sm font-medium text-white">{dateLabel}</span>
          <span className="font-inter text-[11px] text-neutral-500">
            {formatDuration(totalSeconds)} total
          </span>
        </div>
        <button
          type="button"
          onClick={onNextDay}
          disabled={!canGoNext}
          className={`flex items-center gap-1 rounded-lg px-2 py-1 font-inter text-sm transition-colors ${
            canGoNext ? "text-neutral-400 hover:text-white" : "text-neutral-700 cursor-not-allowed"
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {hours.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <Monitor size={24} className="text-neutral-600" />
          <p className="font-manrope text-sm font-medium text-neutral-400">No activity recorded</p>
          <p className="font-inter text-xs text-neutral-500">
            No tool usage was detected on this day. Keep the desktop app running to track your time.
          </p>
        </div>
      ) : (
        <>
          {/* ── Hourly bars (compact overview) ───────────────── */}
          <div className="flex flex-col gap-1">
            <span className="mb-1 font-manrope text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
              Hourly breakdown
            </span>
            {HOURS.map((hour) => {
              const items = byHour.get(hour) ?? [];
              const hourTotal = items.reduce((s, i) => s + i.secondsFocused, 0);
              const barWidth = maxHourlySeconds > 0 ? (hourTotal / maxHourlySeconds) * 100 : 0;
              const isExpanded = expandedHour === hour;

              if (hourTotal === 0) return null; // Skip empty hours

              return (
                <div key={hour} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setExpandedHour(isExpanded ? null : hour)}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.03] transition-colors group"
                  >
                    {/* Hour label */}
                    <span className="w-14 shrink-0 text-right font-inter text-[13px] tabular-nums text-neutral-400 group-hover:text-neutral-300">
                      {formatHour(hour)}
                    </span>

                    {/* Stacked bar */}
                    <div className="h-6 flex-1 overflow-hidden rounded-md bg-white/[0.03]">
                      <div className="flex h-full" style={{ width: `${barWidth}%` }}>
                        {items.map((item, i) => {
                          const itemPct = hourTotal > 0 ? (item.secondsFocused / hourTotal) * 100 : 0;
                          const name = item.trackedTool ?? item.appName;
                          const ai = item.isAiAssisted;
                          return (
                            <div
                              key={i}
                              className="h-full first:rounded-l-md last:rounded-r-md"
                              style={{
                                width: `${itemPct}%`,
                                minWidth: itemPct > 10 ? "auto" : "4px",
                                backgroundColor: appColor(item.appName, item.trackedTool, ai, i),
                              }}
                              title={`${name}: ${formatDuration(item.secondsFocused)}`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Duration + chevron */}
                    <span className="w-14 shrink-0 text-right font-inter text-[13px] tabular-nums text-neutral-500">
                      {formatDuration(hourTotal)}
                    </span>
                    <motion.span
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-neutral-600"
                    >
                      <ChevronDown size={12} />
                    </motion.span>
                  </button>

                  {/* Expanded: per-app detail for this hour */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="ml-[4.25rem] mr-8 mt-1 flex flex-col gap-1.5 rounded-lg bg-white/[0.02] p-3">
                          {items
                            .sort((a, b) => b.secondsFocused - a.secondsFocused)
                            .map((item, i) => {
                              const name = item.trackedTool ?? item.appName;
                              const ai = item.isAiAssisted;
                              return (
                                <div key={i} className="flex items-center justify-between font-inter text-sm">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                      style={{ backgroundColor: appColor(item.appName, item.trackedTool, ai, i) }}
                                    />
                                    <span className="text-neutral-300">{name}</span>
                                    {ai && (
                                      <span className="rounded-full bg-[#3B82F6]/15 px-1.5 py-0.5 font-jakarta text-[9px] font-bold uppercase tracking-wide text-[#60A5FA]">
                                        AI
                                      </span>
                                    )}
                                  </div>
                                  <span className="tabular-nums text-neutral-500">
                                    {formatDuration(item.secondsFocused)}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
