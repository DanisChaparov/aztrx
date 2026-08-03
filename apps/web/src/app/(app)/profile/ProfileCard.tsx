"use client";

import { Github, Mail, Flame, Award, Target, ExternalLink } from "lucide-react";
import type { Plan } from "@focus-forge/core";

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
}

export function ProfileCard({
  avatarUrl, displayName, email, githubUsername, plan,
  streak, level, verifiedSessions, totalSessions, projectsCount, publicUrl,
}: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0f14]">
      {/* Banner */}
      <div className="h-24 bg-gradient-to-r from-[#6744FF]/30 via-[#8b74ff]/20 to-transparent" />

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
            <span className="mb-1 rounded-full bg-[#6744FF]/20 px-3 py-0.5 font-manrope text-[11px] font-semibold text-[#8b74ff]">
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
              className="h-full rounded-full bg-[#6744FF] transition-all"
              style={{ width: `${Math.round(level.progress * 100)}%` }}
            />
          </div>
        </div>

        {/* Public twin link */}
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 font-inter text-sm text-[#8b74ff] transition-colors hover:border-[#6744FF]/30"
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
      {Icon && <Icon size={14} className="text-[#8b74ff]" />}
      <div className="flex flex-col">
        <span className="font-manrope text-lg font-semibold text-white">{value}</span>
        <span className="font-inter text-[11px] text-[#A1A1AA]">{label}</span>
      </div>
    </div>
  );
}
