"use client";

import { Github, Mail, Flame, Award, Target, ExternalLink, Globe, Twitter } from "lucide-react";
import type { Plan, FocusSession } from "@aztrx/core";
import { EditableBio } from "@/components/EditableBio";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

interface Props {
  avatarUrl: string;
  displayName: string;
  email: string | undefined;
  githubUsername: string | undefined;
  plan: Plan;
  streak: number;
  level: { level: number; xp: number; xpForNextLevel: number; progress: number };
  xp: number;
  verifiedSessions: number;
  totalSessions: number;
  projectsCount: number;
  publicUrl: string | null;
  bio: string | null;
  website: string | null;
  twitter: string | null;
  recentSessions: FocusSession[];
}

export function ProfileCard({
  avatarUrl, displayName, email, githubUsername, plan,
  streak, level, verifiedSessions, totalSessions, projectsCount, publicUrl,
  bio, website, twitter, recentSessions,
}: Props) {
  async function saveProfileField(field: string, value: string) {
    const supabase = getBrowserSupabaseClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    // Type assertion needed — Supabase types mark `id` as never for inserts,
    // but upsert requires it for the conflict resolution.
    await (supabase.from("profiles") as any).upsert({ id: data.user.id, [field]: value });
  }

  async function saveBio(newBio: string) {
    await saveProfileField("bio", newBio);
  }

  async function saveWebsite(newWebsite: string) {
    await saveProfileField("website", newWebsite);
  }

  async function saveTwitter(newTwitter: string) {
    await saveProfileField("twitter", newTwitter);
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0f14]">
      {/* Banner */}
      <div className="h-24 bg-gradient-to-r from-[#3B82F6]/30 via-[#60A5FA]/20 to-transparent" />

      <div className="-mt-10 flex flex-col gap-4 px-6 pb-6">
        {/* Avatar + name */}
        <div className="flex items-end gap-4">
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-20 w-20 rounded-full border-4 border-[#0e0f14] bg-[#0e0f14]"
          />
          <div className="mb-1 flex flex-col gap-0.5">
            <h2 className="font-manrope text-xl font-bold text-white">{displayName}</h2>
            <div className="flex items-center gap-3 font-inter text-xs text-[#A1A1AA]">
              {email && (
                <span className="flex items-center gap-1">
                  <Mail size={11} /> {email}
                </span>
              )}
              {githubUsername && (
                <span className="flex items-center gap-1">
                  <Github size={11} /> {githubUsername}
                </span>
              )}
            </div>
          </div>
          {plan === "pro" && (
            <span className="mb-1 rounded-full bg-[#3B82F6]/20 px-3 py-0.5 font-manrope text-[11px] font-semibold text-[#60A5FA]">
              PRO
            </span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-6 border-y border-white/[0.07] py-4">
          <Stat icon={Flame} value={`${streak}d`} label="Streak" />
          <Stat icon={Award} value={`Lv ${level.level}`} label="Level" />
          <Stat icon={Target} value={String(verifiedSessions)} label="Verified" />
          <Stat icon={Target} value={String(totalSessions)} label="Total sessions" />
          <Stat value={String(projectsCount)} label="Projects" />
        </div>

        {/* XP progress */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between font-inter text-xs">
            <span className="text-neutral-400">XP</span>
            <span className="text-neutral-500">{level.xp} / {level.xp + level.xpForNextLevel - Math.floor(level.xp * level.progress)} XP</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-[#3B82F6] transition-all"
              style={{ width: `${Math.round(level.progress * 100)}%` }}
            />
          </div>
        </div>

        {/* Bio */}
        <div className="border-t border-white/[0.07] pt-4">
          <EditableBio initialBio={bio} onSave={saveBio} />
        </div>

        {/* Social links */}
        <div className="flex flex-wrap items-center gap-2">
          {website && (
            <a
              href={website.startsWith("http") ? website : `https://${website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-inter text-xs text-[#60A5FA] hover:border-[#3B82F6]/30 transition-colors"
            >
              <Globe size={11} />
              {website.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 30)}
            </a>
          )}
          {twitter && (
            <a
              href={`https://x.com/${twitter.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-inter text-xs text-[#60A5FA] hover:border-[#3B82F6]/30 transition-colors"
            >
              <Twitter size={11} />
              @{twitter.replace(/^@/, "")}
            </a>
          )}
          {!website && !twitter && (
            <p className="font-inter text-xs text-neutral-600">Add website or X handle from Settings</p>
          )}
        </div>

        {/* Recent sessions */}
        {recentSessions.length > 0 && (
          <div className="border-t border-white/[0.07] pt-4">
            <h3 className="font-manrope text-xs font-medium uppercase tracking-wider text-neutral-500 mb-3">
              Recent sessions
            </h3>
            <div className="flex flex-col gap-1">
              {recentSessions.slice(0, 5).map((s) => {
                const date = new Date(s.startedAt);
                const isToday = date.toDateString() === new Date().toDateString();
                const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString();
                const dateLabel = isToday ? "Today" : isYesterday ? "Yesterday" : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                return (
                  <div key={s.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`shrink-0 h-2 w-2 rounded-full ${
                        s.verified ? "bg-emerald-400" : s.status === "broken" ? "bg-red-400" : "bg-neutral-600"
                      }`} />
                      <span className="font-inter text-sm text-white truncate">
                        {s.plannedDurationMin}min session
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-inter text-xs text-neutral-500">{dateLabel}</span>
                      {s.verified && (
                        <span className="font-inter text-[10px] text-emerald-400/70">✓</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Public twin link */}
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 font-inter text-sm text-[#60A5FA] transition-colors hover:border-[#3B82F6]/30"
          >
            <ExternalLink size={13} />
            Your public developer twin
          </a>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, value, label }: { icon?: any; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className="text-[#60A5FA]" />}
      <div className="flex flex-col">
        <span className="font-manrope text-lg font-semibold text-white">{value}</span>
        <span className="font-inter text-[11px] text-[#A1A1AA]">{label}</span>
      </div>
    </div>
  );
}
