"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Clock, Zap, Calendar, Target } from "lucide-react";

interface FocusInsight {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  color: string;
}

/**
 * Computes personalized focus insights from session history.
 * Both traditional devs and vibe coders get value:
 * - Peak productivity time
 * - Completion rate
 * - Best day of the week
 * - Current streak vs average
 * - Tool diversity
 */
export function FocusInsights({ sessions }: { sessions: any[] }) {
  const [insights, setInsights] = useState<FocusInsight[]>([]);

  useEffect(() => {
    const items: FocusInsight[] = [];

    if (sessions.length === 0) {
      setInsights([]);
      return;
    }

    const completed = sessions.filter((s: any) => s.status === "completed");
    const verified = sessions.filter((s: any) => s.verified);

    // Completion rate
    if (sessions.length >= 3) {
      const rate = Math.round((completed.length / sessions.length) * 100);
      const label = rate >= 80 ? "You finish what you start" : rate >= 50 ? "Steady completer" : "Explorer";
      items.push({
        icon: Target,
        label,
        value: `${rate}% completion rate`,
        color: rate >= 80 ? "text-green-400" : rate >= 50 ? "text-[#60A5FA]" : "text-amber-400",
      });
    }

    // Peak hour
    const hours = completed.map((s: any) => new Date(s.started_at).getHours());
    if (hours.length >= 3) {
      const hourCounts: Record<number, number> = {};
      hours.forEach((h: number) => { hourCounts[h] = (hourCounts[h] || 0) + 1; });
      let peakHour = 9;
      let peakCount = 0;
      for (const [h, c] of Object.entries(hourCounts)) {
        if (c > peakCount) { peakHour = parseInt(h); peakCount = c; }
      }
      const period = peakHour < 12 ? "morning" : peakHour < 17 ? "afternoon" : "evening";
      items.push({
        icon: Clock,
        label: "Peak focus",
        value: `${period} (${peakHour}:00)`,
        color: "text-[#A78BFA]",
      });
    }

    // Best day
    if (completed.length >= 5) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const dayCounts: Record<number, number> = {};
      completed.forEach((s: any) => {
        const d = new Date(s.started_at).getDay();
        dayCounts[d] = (dayCounts[d] || 0) + 1;
      });
      let bestDay = 1;
      let bestCount = 0;
      for (const [d, c] of Object.entries(dayCounts)) {
        if (c > bestCount) { bestDay = parseInt(d); bestCount = c; }
      }
      items.push({
        icon: Calendar,
        label: "Best day",
        value: `${days[bestDay]}s`,
        color: "text-[#60A5FA]",
      });
    }

    // Total focus time
    const totalMin = completed.reduce((sum: number, s: any) => sum + (s.planned_duration_min || 0), 0);
    if (totalMin >= 60) {
      const hours_ = Math.floor(totalMin / 60);
      const mins = totalMin % 60;
      const display = hours_ > 0
        ? `${hours_}h${mins > 0 ? ` ${mins}m` : ""}`
        : `${mins}m`;
      items.push({
        icon: Zap,
        label: "Total focus time",
        value: display,
        color: "text-amber-400",
      });
    }

    setInsights(items);
  }, [sessions]);

  if (insights.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-5">
      <h3 className="font-manrope text-xs font-semibold uppercase tracking-wider text-neutral-500">
        Your focus profile
      </h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {insights.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.01] p-3"
            >
              <Icon size={14} className={`shrink-0 ${item.color}`} />
              <div className="min-w-0">
                <p className="font-inter text-[11px] text-neutral-500">{item.label}</p>
                <p className="font-manrope text-sm font-medium text-white truncate">{item.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
