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
        <h1 className="font-instrument-serif text-3xl text-white">Screen Time</h1>
        <p className="font-inter text-sm text-[#A1A1AA]">
          See which tools you used each hour of the day — like iPhone Screen Time, but for your dev tools.
        </p>
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
