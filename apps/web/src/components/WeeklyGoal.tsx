"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Target, Check } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

/**
 * Weekly goal tracker shown on the dashboard.
 * User sets a target (number of sessions this week), sees progress.
 * Resets every Monday. Simple but gives free users a reason to come back.
 */
export function WeeklyGoal({ plan }: { plan: "free" | "pro" }) {
  const [goal, setGoal] = useState<number | null>(null);
  const [completed, setCompleted] = useState(0);
  const [editing, setEditing] = useState(false);
  const [draftGoal, setDraftGoal] = useState("3");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const supabase = getBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // Load goal from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("weekly_goal_sessions")
        .eq("id", user.id)
        .single();

      // Count this week's completed sessions
      const monday = new Date();
      monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));
      monday.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("focus_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("started_at", monday.toISOString());

      if (!cancelled) {
        setGoal(profile?.weekly_goal_sessions ?? null);
        setCompleted(count ?? 0);
        if (profile?.weekly_goal_sessions) {
          setDraftGoal(String(profile.weekly_goal_sessions));
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  async function saveGoal() {
    const n = parseInt(draftGoal, 10);
    if (!n || n < 1 || n > 20) return;

    const supabase = getBrowserSupabaseClient();
    await supabase.from("profiles").upsert({
      id: (await supabase.auth.getUser()).data.user?.id ?? "",
      weekly_goal_sessions: n,
    });
    setGoal(n);
    setEditing(false);
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0e0f14] p-5">
        <div className="h-4 w-32 animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  const hasGoal = goal !== null;
  const percent = hasGoal ? Math.min(100, Math.round((completed / goal) * 100)) : 0;
  const done = hasGoal && completed >= goal;

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0e0f14] p-5">
      {!hasGoal && !editing ? (
        /* No goal set — prompt to set one */
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex w-full items-center gap-3 text-left transition-colors hover:bg-white/[0.02] rounded-xl p-1 -m-1"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400/10">
            <Target size={16} className="text-amber-400" />
          </div>
          <div>
            <p className="font-manrope text-sm font-medium text-white">Set a weekly goal</p>
            <p className="font-inter text-xs text-[#A1A1AA]">How many sessions this week?</p>
          </div>
        </button>
      ) : editing ? (
        /* Editing */
        <div className="flex items-center gap-3">
          <span className="font-inter text-sm text-[#A1A1AA]">I want to do</span>
          <input
            type="text"
            inputMode="numeric"
            value={draftGoal}
            onChange={(e) => {
              const d = e.target.value.replace(/\D/g, "").slice(0, 2);
              setDraftGoal(d);
            }}
            onKeyDown={(e) => { if (e.key === "Enter") saveGoal(); }}
            className="w-12 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-center font-manrope text-lg font-semibold text-white outline-none focus:border-[#3B82F6]"
            autoFocus
          />
          <span className="font-inter text-sm text-[#A1A1AA]">sessions this week</span>
          <button
            type="button"
            onClick={saveGoal}
            className="ml-auto rounded-lg bg-[#3B82F6] px-3 py-1.5 font-manrope text-xs font-semibold text-white"
          >
            Set
          </button>
        </div>
      ) : (
        /* Goal set — show progress */
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {done ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-400/20">
                  <Check size={13} className="text-green-400" />
                </div>
              ) : (
                <Target size={15} className="text-amber-400" />
              )}
              <span className="font-manrope text-sm font-medium text-white">
                {done ? "Goal reached!" : `${completed}/${goal} sessions`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="font-inter text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              Edit
            </button>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className={`h-full rounded-full ${done ? "bg-green-400" : "bg-[#3B82F6]"}`}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          <p className="font-inter text-[11px] text-neutral-500">
            {done
              ? "Crushed it. Raise the bar?"
              : percent >= 50
              ? "More than halfway — keep going."
              : "The week is young."}
          </p>
        </div>
      )}
    </div>
  );
}
