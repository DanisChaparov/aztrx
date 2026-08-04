"use client";

import { useEffect, useState, useCallback } from "react";
import { ScreenTimeDetail, type HourlyBucketItem } from "@focus-forge/ui";
import { getHourlyScreenTime } from "@focus-forge/api-client";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function ScreenTimePage() {
  const supabase = getBrowserSupabaseClient();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday);
  const [hours, setHours] = useState<HourlyBucketItem[]>([]);
  const [dateLabel, setDateLabel] = useState("");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchDay(selectedDate);
  }, [selectedDate, fetchDay]);

  function goToPrevDay() {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });
  }

  function goToNextDay() {
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      // Don't go past today
      if (d > new Date()) return prev;
      return d;
    });
  }

  const canGoNext = (() => {
    const tomorrow = startOfToday();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    return next < tomorrow;
  })();

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-instrument-serif text-3xl text-white">Screen Time</h1>
          <p className="font-inter text-sm text-[#A1A1AA]">
            See which tools you used each hour — IDE, terminal, browser. Powered by the desktop app.
          </p>
        </div>
        <a
          href="https://github.com/DanisChaparov/upstream-app/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-2 rounded-full bg-white text-black font-medium text-sm px-5 py-2.5 transition-all hover:bg-white/90 active:scale-[0.98]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download Desktop App
        </a>
      </div>

      <div className="rounded-2xl border border-[#3B82F6]/20 bg-[#3B82F6]/[0.04] p-5">
        <p className="font-inter text-sm text-white/80">
          <strong className="text-white">Screen time tracking requires our desktop app.</strong>{" "}
          Browsers can't see what programs you use — that's an OS-level security restriction.
          Our native macOS & Windows app tracks your real tools (VS Code, terminal, browser tabs)
          and syncs to your dashboard.{" "}
          <a href="https://github.com/DanisChaparov/upstream-app/releases" target="_blank" rel="noopener" className="text-[#3B82F6] underline">Download it here</a>.
        </p>
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
        <ScreenTimeDetail
          dateLabel={dateLabel}
          hours={hours}
          onPrevDay={goToPrevDay}
          onNextDay={goToNextDay}
          canGoNext={canGoNext}
        />
      )}
    </div>
  );
}
