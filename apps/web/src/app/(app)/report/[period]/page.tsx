import Link from "next/link";
import { notFound } from "next/navigation";
import { buildReport, type ReportInput } from "@focus-forge/core";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ period: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { period } = await params;
  const { date } = await searchParams;
  if (!["weekly", "monthly", "yearly"].includes(period)) notFound();

  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: sessions } = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(2000);

  const { data: projects } = await supabase.from("projects").select("name, github_repo_url").eq("user_id", user.id);
  const detectedLanguages: string[] = [];
  const langHints: Record<string, string[]> = {
    typescript: ["ts", "typescript", "next", "react"],
    python: ["py", "python"],
    rust: ["rs", "rust"],
    go: ["go", "golang"],
    javascript: ["js", "javascript", "node"],
  };
  for (const p of projects ?? []) {
    const n = p.name.toLowerCase();
    const u = (p.github_repo_url ?? "").toLowerCase();
    for (const [lang, hints] of Object.entries(langHints)) {
      if (hints.some((h) => n.includes(h) || u.includes(h)) && !detectedLanguages.includes(lang)) {
        detectedLanguages.push(lang);
      }
    }
  }

  const input: ReportInput = {
    sessions: (sessions ?? []).map((s) => ({
      id: s.id,
      userId: s.user_id,
      projectId: s.project_id,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      plannedDurationMin: s.planned_duration_min,
      status: s.status as "active" | "completed" | "broken",
      verified: s.verified,
    })),
    languages: detectedLanguages,
    period: period as ReportInput["period"],
    anchor: date,
  };

  const report = buildReport(input);
  const maxMinutes = report.yearProgress ? Math.max(1, ...report.yearProgress.map((b) => b.minutes)) : 1;

  return (
    <main className="min-h-screen bg-[#0b0c10] px-6 py-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-12">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-[#3B82F6]/10 px-4 py-1.5">
            <span className="font-manrope text-[11px] font-semibold uppercase tracking-widest text-[#60A5FA]">
              {report.period.label}
            </span>
          </div>
          <h1 className="font-instrument-serif text-5xl font-bold tracking-tight text-white sm:text-6xl">
            {report.headline}
          </h1>
          <p className="font-inter text-lg text-[#A1A1AA]">
            {report.developerType.name} — {report.developerType.description}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {report.stats.slice(0, 4).map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 rounded-2xl border border-white/10 bg-[#0e0f14] p-5 text-center"
            >
              <span className="font-manrope text-3xl font-bold text-white">{stat.value}</span>
              <span className="font-inter text-xs text-[#A1A1AA]">{stat.label}</span>
              {stat.comparison && (
                <span className="font-mono text-[11px] text-[#60A5FA]">{stat.comparison}</span>
              )}
            </div>
          ))}
        </div>

        {/* Highlights */}
        {report.highlights.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
            <h2 className="font-manrope text-sm font-medium text-neutral-400">Highlights</h2>
            <ul className="flex flex-col gap-2">
              {report.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2.5 font-inter text-sm text-white">
                  <span className="text-[#60A5FA]">✦</span> {h}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Year progress bars */}
        {report.yearProgress && (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
            <h2 className="font-manrope text-sm font-medium text-neutral-400">Month by month</h2>
            <div className="flex items-end gap-1.5" style={{ height: 120 }}>
              {report.yearProgress.map((bar) => (
                <div key={bar.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-col justify-end" style={{ height: 100 }}>
                    <div
                      className="w-full rounded-t-sm bg-[#3B82F6]/60 transition-all hover:bg-[#3B82F6]"
                      style={{ height: `${Math.max(2, (bar.minutes / maxMinutes) * 100)}%` }}
                      title={`${bar.month}: ${bar.sessions} sessions, ${bar.minutes} min`}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">{bar.month}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {report.achievements.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
            <h2 className="font-manrope text-sm font-medium text-neutral-400">Achievements earned</h2>
            <div className="flex flex-wrap gap-2">
              {report.achievements.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/[0.08] px-3 py-1 font-inter text-xs text-[#60A5FA]"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col items-center gap-4 border-t border-white/[0.07] pt-8 text-center">
          <p className="font-inter text-sm text-[#A1A1AA]">
            Generated by{" "}
            <Link href="/" className="font-semibold text-white underline underline-offset-2">
              Upstream
            </Link>
          </p>
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-2.5 font-inter text-sm text-white transition-colors hover:bg-white/[0.08]"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
