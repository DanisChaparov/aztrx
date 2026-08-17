"use client";

import { useEffect, useState, useCallback } from "react";
import { ScreenTimeDetail, type HourlyBucketItem } from "@aztrx/ui";
import { getHourlyScreenTime, getAmbientDailyHours, getAmbientToolSummary, type AmbientToolSummary } from "@aztrx/api-client";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { BarChart3, Monitor, Clock } from "lucide-react";

type ViewMode = "day" | "week" | "month";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

declare global {
  interface Window {
    aztrx?: { isDesktop: boolean };
  }
}

function isRunningInDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.aztrx?.isDesktop === true;
}

export default function ScreenTimePage() {
  const supabase = getBrowserSupabaseClient();
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday);

  // Day view
  const [hours, setHours] = useState<HourlyBucketItem[]>([]);
  const [dateLabel, setDateLabel] = useState("");

  // Week/Month view
  const [dailyHours, setDailyHours] = useState<Array<{ date: string; totalHours: number }>>([]);

  // Tool rankings
  const [toolRankings, setToolRankings] = useState<AmbientToolSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const inDesktop = isRunningInDesktop();

  const fetchDay = useCallback(
    async (date: Date) => {
      setLoading(true);
      try {
        const result = await getHourlyScreenTime(supabase, date);
        setHours(result.hours);
        setDateLabel(result.dateLabel);
      } catch {
        setHours([]);
        setDateLabel("");
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const fetchWeekOrMonth = useCallback(
    async (days: number, since: Date) => {
      setLoading(true);
      try {
        const result = await getAmbientDailyHours(supabase, days);
        setDailyHours(result);
      } catch {
        setDailyHours([]);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  const fetchToolRankings = useCallback(
    async (days: number) => {
      try {
        const since = new Date();
        since.setDate(since.getDate() - days);
        since.setHours(0, 0, 0, 0);
        const result = await getAmbientToolSummary(supabase, { since: since.toISOString() });
        setToolRankings(result);
      } catch {
        setToolRankings([]);
      }
    },
    [supabase]
  );

  useEffect(() => {
    if (viewMode === "day") {
      fetchDay(selectedDate);
      fetchToolRankings(1);
    } else if (viewMode === "week") {
      fetchWeekOrMonth(7, selectedDate);
      fetchToolRankings(7);
    } else {
      fetchWeekOrMonth(30, selectedDate);
      fetchToolRankings(30);
    }
  }, [viewMode, selectedDate, fetchDay, fetchWeekOrMonth, fetchToolRankings]);

  function goToPrevDay() {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "month") {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - (viewMode === "week" ? 7 : 1));
      }
      return d;
    });
  }

  function goToNextDay() {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      if (viewMode === "month") {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + (viewMode === "week" ? 7 : 1));
      }
      if (d > new Date()) return prev;
      return d;
    });
  }

  const canGoNext = (() => {
    const today = startOfToday();
    if (viewMode === "month") {
      return selectedDate.getMonth() < today.getMonth() || selectedDate.getFullYear() < today.getFullYear();
    }
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + (viewMode === "week" ? 7 : 1));
    return next <= today;
  })();

  // Compute period label
  const periodLabel = (() => {
    if (viewMode === "day") return dateLabel;
    if (viewMode === "week") {
      const end = new Date(selectedDate);
      end.setDate(end.getDate() + 6);
      const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
      return `${selectedDate.toLocaleDateString("en-US", opts)} — ${end.toLocaleDateString("en-US", opts)}`;
    }
    return selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  })();

  const maxDailyHours = Math.max(0.5, ...dailyHours.map((d) => d.totalHours));
  const totalPeriodHours = dailyHours.reduce((sum, d) => sum + d.totalHours, 0);

  // Week day labels
  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="font-instrument-serif text-3xl text-white">Screen Time</h1>
            <p className="font-inter text-sm text-[#A1A1AA]">
              See which tools you used each hour — IDE, terminal, browser. Powered by the desktop app.
            </p>
          </div>
          {!inDesktop && (
            <a
              href="https://github.com/DanisChaparov/aztrx/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-2.5 transition-all hover:bg-white/90 active:scale-[0.98]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Desktop App
            </a>
          )}
        </div>

        {!inDesktop && (
          <div className="rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/[0.04] p-5">
            <p className="font-inter text-sm text-white/80">
              <strong className="text-white">Screen time tracking requires our desktop app.</strong>{" "}
              Browsers can't see what programs you use — that's an OS-level security restriction.
              Our native macOS & Windows app tracks your real tools (VS Code, terminal, browser tabs)
              and syncs to your dashboard.{" "}
              <a href="https://github.com/DanisChaparov/aztrx/releases" target="_blank" rel="noopener" className="text-[#3B82F6] underline">Download it here</a>.
            </p>
          </div>
        )}

        {/* View tabs */}
        <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[#0e0f14] p-1 w-fit">
          {([
            { key: "day" as ViewMode, label: "Day" },
            { key: "week" as ViewMode, label: "Week" },
            { key: "month" as ViewMode, label: "Month" },
          ]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setViewMode(tab.key)}
              className={`rounded-full px-4 py-1.5 font-manrope text-sm font-medium transition-all ${
                viewMode === tab.key
                  ? "bg-[#3B82F6] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="glass-panel flex flex-col gap-4 p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-12 animate-pulse rounded bg-white/5" />
              <div className="h-6 flex-1 animate-pulse rounded bg-white/5" />
              <div className="h-4 w-10 animate-pulse rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Main content */}
          <div className="flex-1">
            {viewMode === "day" ? (
              <ScreenTimeDetail
                dateLabel={dateLabel}
                hours={hours}
                onPrevDay={goToPrevDay}
                onNextDay={goToNextDay}
                canGoNext={canGoNext}
              />
            ) : (
              /* Week / Month bar chart */
              <div className="glass-panel flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-manrope text-sm font-medium text-white">{periodLabel}</p>
                    <p className="font-inter text-xs text-neutral-500 mt-0.5">
                      {Math.round(totalPeriodHours * 10) / 10}h total across {dailyHours.length} day{dailyHours.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={goToPrevDay}
                      className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={goToNextDay}
                      disabled={!canGoNext}
                      className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 transition-colors disabled:text-neutral-700"
                    >
                      →
                    </button>
                  </div>
                </div>

                <div className="flex items-end gap-1" style={{ height: 140 }}>
                  {dailyHours.length === 0 && (
                    <p className="self-center w-full text-center font-inter text-sm text-neutral-500">
                      No screen time data for this period.
                    </p>
                  )}
                  {dailyHours.map((day, i) => {
                    const pct = (day.totalHours / maxDailyHours) * 100;
                    const date = new Date(day.date);
                    const label = viewMode === "month"
                      ? date.getDate().toString()
                      : dayLabels[date.getDay() === 0 ? 6 : date.getDay() - 1];
                    const isToday = day.date === startOfToday().toISOString().slice(0, 10);
                    return (
                      <div key={day.date} className="flex flex-1 flex-col items-center gap-1 min-w-0">
                        <div className="flex w-full flex-col justify-end" style={{ height: 110 }}>
                          <div
                            className={`w-full rounded-t-sm mx-auto transition-colors ${
                              isToday ? "bg-[#3B82F6]" : "bg-[#3B82F6]/40 hover:bg-[#3B82F6]/60"
                            }`}
                            style={{ height: `${Math.max(1, pct)}%`, maxWidth: viewMode === "month" ? "100%" : "80%" }}
                            title={`${day.date}: ${Math.round(day.totalHours * 10) / 10}h`}
                          >
                            {pct > 25 && (
                              <span className="block text-center font-mono text-[9px] text-white pt-0.5">
                                {(Math.round(day.totalHours * 10) / 10).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`font-mono text-[10px] ${isToday ? "text-[#60A5FA] font-semibold" : "text-neutral-500"}`}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Tool ranking sidebar */}
          {toolRankings.length > 0 && (
            <div className="lg:w-64 shrink-0">
              <div className="glass-panel flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} className="text-[#60A5FA]" />
                  <h3 className="font-manrope text-xs font-medium uppercase tracking-wider text-neutral-400">
                    Top tools
                  </h3>
                </div>
                <div className="flex flex-col gap-1">
                  {toolRankings.slice(0, 8).map((tool, i) => {
                    const pct = totalPeriodHours > 0
                      ? Math.round((tool.totalSeconds / 3600 / totalPeriodHours) * 100)
                      : 0;
                    return (
                      <div key={tool.appName} className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-neutral-500 w-5 text-right">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-inter text-xs text-white truncate">
                              {tool.appName}
                            </span>
                            <span className="font-mono text-[10px] text-neutral-500 shrink-0 ml-1">
                              {pct}%
                            </span>
                          </div>
                          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/5">
                            <div
                              className={`h-full rounded-full ${
                                tool.isAiAssisted ? "bg-purple-400/60" : "bg-[#3B82F6]/50"
                              }`}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                        {tool.isAiAssisted && (
                          <span className="font-inter text-[9px] text-purple-400/70 shrink-0" title="AI-assisted tool">
                            AI
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
