import {
  getCommitsForSessions,
  getImpactLedgerSummary,
  getPlan,
  getPublicProfileEnabled,
  getToolUsageSummary,
  listProjects,
  listSessions,
} from "@focus-forge/api-client";
import {
  ACHIEVEMENTS,
  buildHeatmap,
  calculateStreak,
  calculateXp,
  getLevelInfo,
  getUnlockedAchievements,
} from "@focus-forge/core";
import {
  AchievementGrid,
  Heatmap,
  ImpactLedgerList,
  LevelBadge,
  RevealSection,
  SessionCard,
  StreakFlame,
  ToolUsageList,
} from "@focus-forge/ui";
import { DeveloperTwin } from "@/components/DeveloperTwin";
import { PlanBadge } from "@/components/PlanBadge";
import { ShareProfileToggle } from "@/components/ShareProfileToggle";
import { EnableNotificationsButton } from "@/components/EnableNotificationsButton";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { WaterButton } from "@/components/WaterButton";
import { getServerSupabaseClient } from "@/lib/supabase/server";

function formatDeadline(deadline: string | null): string | null {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return "Due today";
  return `${days}d left`;
}

export default async function DashboardPage() {
  const supabase = await getServerSupabaseClient();
  // Gamification (streak/XP/achievements/heatmap) needs full history, not just
  // the handful shown in "Recent sessions" below — a low limit here would make
  // the streak and level silently wrong once someone has more than a few sessions.
  const [allSessions, projects, impactSummary, toolUsage, plan, publicProfileEnabled] = await Promise.all([
    listSessions(supabase, { limit: 1000 }),
    listProjects(supabase),
    getImpactLedgerSummary(supabase),
    getToolUsageSummary(supabase),
    getPlan(supabase),
    getPublicProfileEnabled(supabase),
  ]);
  const { data: userData } = await supabase.auth.getUser();
  const githubUsername = (userData.user?.user_metadata?.user_name as string | undefined) ?? null;

  const streak = calculateStreak(allSessions);
  const xp = calculateXp(allSessions);
  const levelInfo = getLevelInfo(xp);
  const dependenciesFunded = impactSummary.length;
  const unlockedAchievements = getUnlockedAchievements({ sessions: allSessions, streak, xp, dependenciesFunded });
  const unlockedIds = new Set(unlockedAchievements.map((a) => a.id));
  const heatmapDays = buildHeatmap(allSessions, 12);
  // Strip `isUnlocked` (a function) before crossing into the Client Component —
  // React can't serialize functions across the server/client boundary.
  const achievementSummaries = ACHIEVEMENTS.map(({ id, name, description, icon }) => ({
    id,
    name,
    description,
    icon,
  }));

  const recentSessions = allSessions.slice(0, 10);
  const projectsById = new Map(projects.map((p) => [p.id, p]));
  const deadlineProjects = projects.filter((p) => p.deadline);
  const linkedProject = projects.find((p) => p.githubRepoUrl);
  const commitsBySession = await getCommitsForSessions(
    supabase,
    recentSessions.map((s) => s.id)
  );

  return (
    <div className="flex flex-col gap-10 pt-8">
      <div className="flex items-center justify-between">
        <h1 className="font-instrument-serif text-3xl text-white">Dashboard</h1>
        <WaterButton href="/session" variant="primary">
          Start a session
        </WaterButton>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <StreakFlame streak={streak} />
        <LevelBadge levelInfo={levelInfo} />
        <PlanBadge plan={plan} />
        <EnableNotificationsButton />
      </div>

      {/* First real content on the page: unlike everything below it, this has
          something to say before the user has run a single session. */}
      <RevealSection>
        <DeveloperTwin />
      </RevealSection>

      <RevealSection>
        <ShareProfileToggle githubUsername={githubUsername} initialEnabled={publicProfileEnabled} />
      </RevealSection>

      {linkedProject && (
        <RevealSection>
          <LiveActivityFeed projectId={linkedProject.id} projectName={linkedProject.name} />
        </RevealSection>
      )}

      <RevealSection>
        <section className="flex flex-col gap-3">
          <h2 className="font-manrope text-sm font-medium text-neutral-400">Activity</h2>
          <div className="glass-panel overflow-x-auto p-4">
            <Heatmap days={heatmapDays} />
          </div>
        </section>
      </RevealSection>

      <RevealSection delay={0.05}>
        <section className="flex flex-col gap-3">
          <h2 className="font-manrope text-sm font-medium text-neutral-400">
            Achievements ({unlockedIds.size}/{ACHIEVEMENTS.length})
          </h2>
          <AchievementGrid achievements={achievementSummaries} unlockedIds={unlockedIds} />
        </section>
      </RevealSection>

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

      <RevealSection>
        <section className="flex flex-col gap-3">
          <h2 className="font-manrope text-sm font-medium text-neutral-400">Tools used</h2>
          <ToolUsageList items={toolUsage} />
        </section>
      </RevealSection>

      <RevealSection>
        <section className="flex flex-col gap-3">
          <h2 className="font-manrope text-sm font-medium text-neutral-400">Impact ledger</h2>
          <ImpactLedgerList items={impactSummary} />
        </section>
      </RevealSection>

      <RevealSection>
        <section className="flex flex-col gap-3">
          <h2 className="font-manrope text-sm font-medium text-neutral-400">Recent sessions</h2>
          {recentSessions.length === 0 && <p className="font-inter text-sm text-neutral-500">No sessions yet.</p>}
          <div className="flex flex-col gap-2">
            {recentSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                projectName={session.projectId ? projectsById.get(session.projectId)?.name : undefined}
                commits={commitsBySession.get(session.id)}
              />
            ))}
          </div>
        </section>
      </RevealSection>
    </div>
  );
}
