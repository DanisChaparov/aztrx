import type { Metadata } from "next";
import { calculateStreak, calculateXp, getLevelInfo } from "@focus-forge/core";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "My coding stats — Upstream",
    description: "Track · Focus · Verify · Grow. See your developer stats on Upstream.",
    openGraph: {
      title: "My coding stats — Upstream",
      description: "Productive Focus for Developers. Track your coding journey.",
      images: [{ url: "/api/og/share?type=stats", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: "My coding stats — Upstream",
      description: "Productive Focus for Developers",
      images: ["/api/og/share?type=stats"],
    },
  };
}

export default async function SharePage() {
  const supabase = await getServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0b0c10] px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <span className="font-manrope text-4xl font-bold text-white">Upstream</span>
          <p className="font-inter text-lg text-[#A1A1AA]">Productive Focus for Developers</p>
          <Link href="/login" className="rounded-xl bg-[#3B82F6] px-6 py-3 font-manrope font-semibold text-white">
            Sign in to see your stats
          </Link>
        </div>
      </main>
    );
  }

  const { data: sessions } = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(500);

  const { data: toolUsage } = await supabase
    .from("session_app_usage")
    .select("app_name, seconds_active");

  const verified = (sessions ?? []).filter((s: any) => s.verified);
  const streak = calculateStreak(verified.map(mapSession));
  const xp = calculateXp(verified.map(mapSession));
  const level = getLevelInfo(xp);

  const toolTotals = new Map<string, number>();
  for (const row of (toolUsage ?? [])) {
    toolTotals.set(row.app_name, (toolTotals.get(row.app_name) ?? 0) + row.seconds_active);
  }
  const topTools: string[] = Array.from(toolTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);

  const devType = streak >= 30 ? "Iron Will" : streak >= 7 ? "Week Warrior" : verified.length >= 10 ? "Steady Craftsman" : "Rising Developer";
  const username = user.user_metadata?.user_name ?? "Developer";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b0c10] px-6 py-16" style={{
      background: "linear-gradient(135deg, #0b0c10 0%, #1a1040 50%, #0b0c10 100%)",
    }}>
      <div className="flex w-full max-w-lg flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-manrope text-xs font-semibold uppercase tracking-[0.2em] text-[#60A5FA]">Upstream</span>
            <h1 className="mt-1 font-manrope text-2xl font-bold text-white">{username}</h1>
          </div>
          <span className="rounded-full border border-[#60A5FA]/30 px-4 py-1.5 font-manrope text-xs font-semibold text-[#60A5FA]">
            {devType}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatBox label="Streak" value={`${streak}d`} />
          <StatBox label="Level" value={String(level.level)} />
          <StatBox label="Sessions" value={String(verified.length)} />
          <StatBox label="XP" value={String(xp)} />
        </div>

        {/* Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-manrope text-xs text-neutral-400">Top tools</span>
          {topTools.length > 0 ? topTools.map((tool: string) => (
            <span key={tool} className="rounded-full bg-[#60A5FA]/15 px-4 py-1.5 font-manrope text-xs font-semibold text-white">
              {tool}
            </span>
          )) : (
            <span className="font-inter text-xs text-neutral-500">Start a session to see your tools</span>
          )}
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-4 border-t border-white/[0.07] pt-6">
          <p className="font-inter text-sm text-[#A1A1AA]">
            Productive Focus for Developers
          </p>
          <Link href="/dashboard" className="rounded-xl bg-[#3B82F6] px-6 py-2.5 font-manrope text-sm font-semibold text-white">
            Get your own stats →
          </Link>
        </div>
      </div>
    </main>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.02] py-4">
      <span className="font-manrope text-3xl font-bold text-[#60A5FA]">{value}</span>
      <span className="font-manrope text-[11px] uppercase tracking-wider text-neutral-500">{label}</span>
    </div>
  );
}

function mapSession(s: any) {
  return {
    id: s.id, userId: s.user_id, projectId: s.project_id,
    startedAt: s.started_at, endedAt: s.ended_at,
    plannedDurationMin: s.planned_duration_min,
    status: s.status as "active" | "completed" | "broken",
    verified: s.verified,
  };
}
