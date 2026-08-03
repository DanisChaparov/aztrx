import { getPlan, getPublicProfileEnabled, listProjects, listSessions } from "@focus-forge/api-client";
import { calculateStreak, calculateXp, getLevelInfo } from "@focus-forge/core";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { ProfileCard } from "./ProfileCard";
import Link from "next/link";
import { Settings, Crown, Timer, FolderKanban, ExternalLink } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await getServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const [sessions, projects, plan, publicProfile] = await Promise.all([
    listSessions(supabase, { limit: 100 }),
    listProjects(supabase),
    getPlan(supabase),
    getPublicProfileEnabled(supabase),
  ]);

  const streak = calculateStreak(sessions);
  const xp = calculateXp(sessions);
  const level = getLevelInfo(xp);
  const verifiedCount = sessions.filter((s) => s.verified).length;

  // Read the stored display_name from profiles (may not exist yet if migrations
  // haven't been applied — degrade gracefully to OAuth metadata).
  let profilesDisplayName: string | undefined;
  try {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    profilesDisplayName = profileRow?.display_name ?? undefined;
  } catch {
    // Column or table missing — not fatal.
  }

  // Avatar from GitHub or Gravatar fallback.
  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
    || `https://www.gravatar.com/avatar/${user.email}?d=identicon`;
  const displayName = profilesDisplayName
    || (user.user_metadata?.full_name as string | undefined)
    || (user.user_metadata?.user_name as string | undefined)
    || user.email?.split("@")[0]
    || "Developer";
  const githubUsername = user.user_metadata?.user_name as string | undefined;

  const publicUrl = githubUsername && publicProfile
    ? `/u/${githubUsername}`
    : null;

  return (
    <div className="flex flex-col gap-8 pt-8">
      <h1 className="font-instrument-serif text-3xl text-white">Profile</h1>

      <ProfileCard
        avatarUrl={avatarUrl}
        displayName={displayName}
        email={user.email}
        githubUsername={githubUsername}
        plan={plan}
        streak={streak}
        level={level}
        xp={xp}
        verifiedSessions={verifiedCount}
        totalSessions={sessions.length}
        projectsCount={projects.length}
        publicUrl={publicUrl}
      />

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { href: "/session", icon: Timer, label: "Start a focus session", desc: "25, 50, or 90 minutes" },
          { href: "/projects", icon: FolderKanban, label: "Manage projects", desc: `${projects.length} project${projects.length !== 1 ? "s" : ""}` },
          { href: "/settings", icon: Settings, label: "Notification settings", desc: "Email, push, preferences" },
          { href: "/plans", icon: Crown, label: `${plan === "pro" ? "Pro plan" : "Upgrade to Pro"}`, desc: plan === "pro" ? "You have full access" : "Unlock AI mentor & reports" },
          ...(publicUrl ? [{ href: publicUrl, icon: ExternalLink, label: "Your public twin", desc: `upstream.dev${publicUrl}` }] : []),
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-4 transition-colors hover:border-white/20"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">
              <link.icon size={16} className="text-[#8b74ff]" />
            </div>
            <div>
              <p className="font-manrope text-sm font-medium text-white">{link.label}</p>
              <p className="font-inter text-xs text-[#A1A1AA]">{link.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
