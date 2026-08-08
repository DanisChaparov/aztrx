import {
  getPlan,
  getPublicProfileEnabled,
  listProjects,
  listSessions,
} from "@focus-forge/api-client";
import { calculateStreak, calculateXp, getLevelInfo } from "@focus-forge/core";
import { LevelBadge, RevealSection, StreakFlame } from "@focus-forge/ui";
import { DashboardData } from "./DashboardData";
import { WelcomeGreeting } from "./WelcomeGreeting";
import { DeveloperTwin } from "@/components/DeveloperTwin";
import { OnboardingForm } from "@/components/OnboardingForm";
import { ShareCard } from "@/components/ShareCard";
import { WeeklyInsight } from "@/components/WeeklyInsight";
import { PlanBadge } from "@/components/PlanBadge";
import { ShareProfileToggle } from "@/components/ShareProfileToggle";
import { EnableNotificationsButton } from "@/components/EnableNotificationsButton";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { WaterButton } from "@/components/WaterButton";
import { WeeklyGoal } from "@/components/WeeklyGoal";
import { FocusInsights } from "@/components/FocusInsights";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Dashboard shell — renders instantly with the critical header (greeting,
 * streak, level) and streams the heavier sections via client components.
 *
 * The 1000-session fetch was blocking the entire page from rendering. Now
 * the shell appears immediately (backed by the layout's loading.tsx skeleton
 * during navigation), and the data-heavy sections fetch on the client side
 * where they don't block the initial paint.
 */
export default async function DashboardPage() {
  const supabase = await getServerSupabaseClient();

  // Fast: just the essentials for the header. The rest streams in client-side.
  const [sessions, projects, plan, publicProfileEnabled, userResp] = await Promise.all([
    listSessions(supabase, { limit: 60 }), // enough for accurate streak/level
    listProjects(supabase),
    getPlan(supabase),
    getPublicProfileEnabled(supabase),
    supabase.auth.getUser(),
  ]);

  // Read the stored display_name from profiles (may not exist yet if migrations
  // haven't been applied — degrade gracefully).
  let profilesDisplayName: string | undefined;
  const userId = userResp.data.user?.id;
  if (userId) {
    try {
      const { data: profileRow } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", userId)
        .single();
      profilesDisplayName = profileRow?.display_name ?? undefined;
    } catch {
      // Column or table missing — not fatal.
    }
  }

  const streak = calculateStreak(sessions);
  const xp = calculateXp(sessions);
  const levelInfo = getLevelInfo(xp);
  const githubUsername = (userResp.data.user?.user_metadata?.user_name as string | undefined) ?? null;
  const displayName = profilesDisplayName
    ?? (userResp.data.user?.user_metadata?.full_name as string | undefined)
    ?? githubUsername
    ?? userResp.data.user?.email?.split("@")[0]
    ?? "developer";

  const linkedProject = projects.find((p) => p.githubRepoUrl);

  return (
    <div className="flex flex-col gap-10 pt-8">
      {/* ── header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <WelcomeGreeting name={displayName} streak={streak} />
        <div className="flex items-center gap-2">
          <ShareCard />
          <WaterButton href="/session" variant="primary">
            Start a session
          </WaterButton>
        </div>
      </div>

      {/* ── onboarding (shows only if display name not set) ── */}
      <OnboardingForm />

      {/* ── weekly insight (works for everyone, no GitHub needed) ── */}
      <WeeklyInsight />

      {/* ── stats ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-4">
        <StreakFlame streak={streak} />
        <LevelBadge levelInfo={levelInfo} />
        <PlanBadge plan={plan} />
        <EnableNotificationsButton />
      </div>

      {/* ── weekly goal ────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
          padding: "16px 20px",
          borderRadius: "12px",
          marginBottom: "12px",
          fontFamily: "monospace",
          fontSize: "13px",
          color: "white",
          fontWeight: "bold",
        }}
      >
        DEBUG · Build: 2025-08-08-01 · WeeklyGoal below
      </div>
      <WeeklyGoal plan={plan} />

      {/* ── focus insights ─────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #F59E0B, #EF4444)",
          padding: "16px 20px",
          borderRadius: "12px",
          marginBottom: "12px",
          fontFamily: "monospace",
          fontSize: "13px",
          color: "white",
          fontWeight: "bold",
        }}
      >
        DEBUG · Build: 2025-08-08-01 · FocusInsights below
      </div>
      <FocusInsights sessions={sessions} />

      {/* ── developer profile + twin ───────────────────────── */}
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

      {/* ── heavy data: streamed client-side ───────────────── */}
      <DashboardData
        initialSessions={sessions}
        projects={projects}
        plan={plan}
        publicProfileEnabled={publicProfileEnabled}
      />
    </div>
  );
}
