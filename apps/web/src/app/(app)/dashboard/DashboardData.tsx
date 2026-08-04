"use client";

import { useEffect, useState } from "react";
import type { FocusSession, Project } from "@focus-forge/core";
import {
  buildHeatmap,
  calculateStreak,
  calculateXp,
  getAchievementsWithProgress,
  getLevelInfo,
  type AchievementContext,
} from "@focus-forge/core";
import {
  getCommitsForSessions,
  getDailyScreenTime,
  getImpactLedgerSummary,
  getSessionAppUsage,
  type ImpactLedgerSummaryRow,
} from "@focus-forge/api-client";
import {
  AchievementGrid,
  DailyScreenTime,
  Heatmap,
  ImpactLedgerList,
  RevealSection,
  SessionCard,
  type DailyScreenTimeItem,
  type ToolUsageItem,
} from "@focus-forge/ui";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { DeveloperProfileCard } from "@/components/DeveloperProfileCard";

interface Props {
  initialSessions: FocusSession[];
  projects: Project[];
  plan: "free" | "pro";
  publicProfileEnabled: boolean;
}

const RECENT_SESSIONS_SHOWN = 5;
const LANG_HINTS: Record<string, string[]> = {
  typescript: ["ts", "typescript", "next", "react", "angular", "vue", "node"],
  python: ["py", "python", "django", "flask", "fastapi", "pytorch"],
  rust: ["rs", "rust", "cargo", "actix", "tokio", "tauri"],
  go: ["go", "golang", "gin", "echo", "fiber"],
  javascript: ["js", "javascript", "express", "svelte"],
  java: ["java", "spring", "kotlin", "gradle", "maven"],
  ruby: ["rb", "ruby", "rails", "jekyll"],
  csharp: ["cs", "csharp", "dotnet", "blazor", "xamarin"],
  swift: ["swift", "ios", "swiftui", "uikit"],
  php: ["php", "laravel", "symfony", "wordpress"],
};

export function DashboardData({ initialSessions, projects, plan, publicProfileEnabled }: Props) {
  const [sessions] = useState(initialSessions);
  const [impactSummary, setImpactSummary] = useState<ImpactLedgerSummaryRow[]>([]);
  const [commitsBySession, setCommitsBySession] = useState<Map<string, any[]>>(new Map());
  const [toolsBySession, setToolsBySession] = useState<Map<string, ToolUsageItem[]>>(new Map());
  const [screenTime, setScreenTime] = useState<DailyScreenTimeItem[]>([]);
  const [screenTimeDate, setScreenTimeDate] = useState("");
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Fetch heavy data client-side so it doesn't block the shell.
  useEffect(() => {
    let cancelled = false;
    const supabase = getBrowserSupabaseClient();

    Promise.all([
      getImpactLedgerSummary(supabase),
      getDailyScreenTime(supabase),
      getCommitsForSessions(
        supabase,
        sessions.slice(0, 20).map((s) => s.id)
      ),
      // Fetch per-session tool usage for the recent sessions shown in the list.
      Promise.all(
        sessions.slice(0, RECENT_SESSIONS_SHOWN).map((s) =>
          getSessionAppUsage(supabase, s.id).then((tools) => ({ sessionId: s.id, tools }))
        )
      ),
    ])
      .then(([impact, screenTimeData, commits, sessionTools]) => {
        if (cancelled) return;
        setImpactSummary(impact);
        setScreenTime(screenTimeData.map((item) => ({
          appName: item.appName,
          trackedTool: item.trackedTool,
          isAiAssisted: item.isAiAssisted,
          totalSeconds: item.totalSeconds,
        })));
        setScreenTimeDate(new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }));
        setCommitsBySession(commits);
        const map = new Map<string, ToolUsageItem[]>();
        for (const { sessionId, tools: t } of sessionTools) {
          if (t.length > 0) map.set(sessionId, t);
        }
        setToolsBySession(map);
        setLoaded(true);
      })
      .catch(() => { if (!cancelled) setLoaded(true); });

    return () => { cancelled = true; };
  }, [sessions]);

  // ── compute gamification from sessions ──────────────────
  const streak = calculateStreak(sessions);
  const xp = calculateXp(sessions);
  const dependenciesFunded = impactSummary.length;

  // Languages from project names
  const detectedLanguages: string[] = [];
  for (const p of projects.filter((p) => p.githubRepoUrl)) {
    const n = p.name.toLowerCase();
    const u = (p.githubRepoUrl ?? "").toLowerCase();
    for (const [lang, hints] of Object.entries(LANG_HINTS)) {
      if (hints.some((h) => n.includes(h) || u.includes(h)) && !detectedLanguages.includes(lang)) {
        detectedLanguages.push(lang);
      }
    }
  }

  const verifiedSessions = sessions.filter((s) => s.verified);
  const achievementCtx: AchievementContext = {
    sessions,
    streak,
    xp,
    dependenciesFunded,
    detectedLanguages,
    morningSessions: verifiedSessions.filter((s) => { const h = new Date(s.startedAt).getHours(); return h >= 5 && h < 9; }).length,
    nightSessions: verifiedSessions.filter((s) => { const h = new Date(s.startedAt).getHours(); return h >= 22 || h < 5; }).length,
    publicProfileEnabled,
  };

  const achievementsWithProgress = getAchievementsWithProgress(achievementCtx);
  const unlockedIds = new Set(achievementsWithProgress.filter((a) => a.unlocked).map((a) => a.id));
  const heatmapDays = buildHeatmap(sessions, 12);

  const recentSessions = showAllSessions ? sessions.slice(0, 30) : sessions.slice(0, RECENT_SESSIONS_SHOWN);
  const projectsById = new Map(projects.map((p) => [p.id, p]));
  const deadlineProjects = projects.filter((p) => p.deadline);

  function formatDeadline(deadline: string | null): string | null {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `Overdue by ${Math.abs(days)}d`;
    if (days === 0) return "Due today";
    return `${days}d left`;
  }

  return (
    <>
      {/* Developer Profile */}
      <RevealSection>
        <DeveloperProfileCard plan={plan} />
      </RevealSection>

      {/* Screen Time — iPhone-style daily tool usage */}
      <RevealSection>
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-manrope text-sm font-medium text-neutral-400">Today's tools</h2>
            {screenTime.length > 0 && (
              <a
                href="/screen-time"
                className="font-inter text-xs text-[#60A5FA] hover:underline transition-colors"
              >
                See all →
              </a>
            )}
          </div>
          {!loaded ? (
            <div className="glass-panel flex items-center gap-2 p-6">
              <div className="h-4 w-full animate-pulse rounded bg-white/5" />
            </div>
          ) : (
            <DailyScreenTime items={screenTime} dateLabel={screenTimeDate} />
          )}
        </section>
      </RevealSection>

      {/* Heatmap */}
      <RevealSection>
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-manrope text-sm font-medium text-neutral-400">Activity</h2>
            <span className="font-inter text-[11px] text-neutral-600">Last 12 weeks</span>
          </div>
          <div className="glass-panel overflow-x-auto p-4">
            <Heatmap days={heatmapDays} />
          </div>
        </section>
      </RevealSection>

      {/* Achievements */}
      <RevealSection delay={0.05}>
        <section className="flex flex-col gap-3">
          <h2 className="font-manrope text-sm font-medium text-neutral-400">
            Achievements ({unlockedIds.size}/{achievementsWithProgress.length})
          </h2>
          <AchievementGrid
            achievements={achievementsWithProgress.map((a) => ({
              id: a.id,
              name: a.name,
              description: a.description,
              icon: a.icon,
              unlocked: a.unlocked,
              progress: a.progress,
              hint: a.hint,
            }))}
          />
        </section>
      </RevealSection>

      {/* Deadlines */}
      {deadlineProjects.length > 0 && (
        <RevealSection>
          <section className="flex flex-col gap-3">
            <h2 className="font-manrope text-sm font-medium text-neutral-400">Deadlines</h2>
            <div className="glass-panel flex flex-col divide-y divide-white/5 p-1">
              {deadlineProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between px-3 py-2.5 font-inter text-sm">
                  <span className="text-neutral-200">{project.name}</span>
                  <span className="text-neutral-500">{formatDeadline(project.deadline)}</span>
                </div>
              ))}
            </div>
          </section>
        </RevealSection>
      )}

      {/* OSS Impact (Simulated) */}
      <RevealSection>
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="font-manrope text-sm font-medium text-neutral-400">OSS Impact (Simulated)</h2>
            <span className="font-inter text-[11px] text-neutral-600">
              Simulated funding for open-source dependencies — based on your verified focus time. Not real money.
            </span>
          </div>
          {!loaded ? (
            <div className="glass-panel flex items-center gap-2 p-4">
              <div className="h-3 w-full animate-pulse rounded bg-white/5" />
            </div>
          ) : impactSummary.length === 0 ? (
            <p className="font-inter text-sm text-neutral-500">
              No dependencies funded yet — link a GitHub repo to a project and complete a verified session.
            </p>
          ) : (
            <ImpactLedgerList items={impactSummary} />
          )}
        </section>
      </RevealSection>

      {/* Recent sessions */}
      <RevealSection>
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-manrope text-sm font-medium text-neutral-400">Recent sessions</h2>
            {sessions.length > RECENT_SESSIONS_SHOWN && (
              <button
                type="button"
                onClick={() => setShowAllSessions(!showAllSessions)}
                className="font-inter text-xs text-[#60A5FA] hover:underline"
              >
                {showAllSessions ? "Show less" : `Show all (${sessions.length})`}
              </button>
            )}
          </div>
          {sessions.length === 0 && (
            <p className="font-inter text-sm text-neutral-500">No sessions yet — start one above.</p>
          )}
          <div className="flex flex-col gap-2">
            {recentSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                projectName={session.projectId ? projectsById.get(session.projectId)?.name : undefined}
                commits={commitsBySession.get(session.id)}
                tools={toolsBySession.get(session.id)}
              />
            ))}
          </div>
        </section>
      </RevealSection>
    </>
  );
}
