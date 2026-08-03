"use client";

import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Code, Zap, Target } from "lucide-react";

interface Insight {
  title: string;
  value: string;
  subtitle: string;
  icon: typeof Sparkles;
  color: string;
}

/**
 * Weekly insight card — the first thing every user sees on their dashboard.
 *
 * Works for EVERY type of coder:
 * - Vibe coder: "You prompted AI 47 times this week. That's your best week yet."
 * - Beginner: "You touched 3 new concepts. JavaScript closures, async/await, and React hooks."
 * - Pro: "12 verified sessions, 34 commits. Your most productive week in 3 months."
 *
 * No GitHub required. Works with just tool usage data.
 */
export function WeeklyInsight() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Compute insights from localStorage + basic session data.
    // In production this would come from an API that aggregates real data.
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weekStart = now - weekMs;

    const items: Insight[] = [];

    // Check for AI tool usage (from ambient tracking or window titles).
    const aiToolsUsed = localStorage.getItem("upstream-ai-tools") || "";
    if (aiToolsUsed) {
      items.push({
        title: "AI-powered",
        value: aiToolsUsed,
        subtitle: "AI tools used this week",
        icon: Zap,
        color: "text-amber-400",
      });
    }

    // Session count from localStorage or estimate.
    const sessionCount = parseInt(localStorage.getItem("upstream-weekly-sessions") || "0");
    if (sessionCount > 0) {
      const label = sessionCount === 1 ? "session" : "sessions";
      items.push({
        title: sessionCount >= 5 ? "Consistent" : "Building momentum",
        value: String(sessionCount),
        subtitle: `focus ${label} this week`,
        icon: Target,
        color: "text-[#8b74ff]",
      });
    }

    // Project count.
    const projectCount = parseInt(localStorage.getItem("upstream-weekly-projects") || "0");
    if (projectCount > 0) {
      items.push({
        title: "Creator",
        value: String(projectCount),
        subtitle: `project${projectCount > 1 ? "s" : ""} touched this week`,
        icon: Code,
        color: "text-green-400",
      });
    }

    // Always show at least one insight — even for brand new users.
    if (items.length === 0) {
      items.push({
        title: "Just getting started",
        value: "Day 1",
        subtitle: "Your journey begins. Start a session to see insights.",
        icon: TrendingUp,
        color: "text-[#8b74ff]",
      });
    }

    setInsights(items);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0e0f14] p-5">
        <Sparkles size={15} className="animate-pulse text-[#8b74ff]" />
        <span className="font-inter text-sm text-[#A1A1AA]">Analyzing your week…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#6744FF]/20 bg-[#0e0f14] p-5">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-[#8b74ff]" />
        <h3 className="font-manrope text-xs font-semibold uppercase tracking-wider text-[#8b74ff]">
          Your week in code
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {insights.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex flex-col gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
            >
              <div className="flex items-center gap-1.5">
                <Icon size={13} className={item.color} />
                <span className="font-manrope text-[11px] font-medium text-neutral-400">{item.title}</span>
              </div>
              <span className="font-manrope text-2xl font-bold text-white">{item.value}</span>
              <span className="font-inter text-[11px] text-[#A1A1AA]">{item.subtitle}</span>
            </div>
          );
        })}
      </div>

      <p className="font-inter text-[11px] text-neutral-600">
        {insights.length >= 3
          ? "Pro users get detailed analysis, learning recommendations, and shareable weekly reports."
          : "Start a session to unlock personalized insights. Free forever."}
      </p>
    </div>
  );
}
