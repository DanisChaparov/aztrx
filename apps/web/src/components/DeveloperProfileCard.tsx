"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, ArrowRight, Sparkles } from "lucide-react";
import type { DeveloperProfile } from "@aztrx/core";
import { ProUpsell } from "@/components/ProUpsell";

export function DeveloperProfileCard({ plan }: { plan: "free" | "pro" }) {
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/developer-profile")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: DeveloperProfile & { error?: string }) => {
        if (!cancelled) {
          if (data.error) setFailed(true);
          else setProfile(data);
        }
      })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
        <Loader2 size={16} className="animate-spin text-[#60A5FA]" />
        <span className="font-inter text-sm text-[#A1A1AA]">Building your developer profile…</span>
      </div>
    );
  }

  if (failed || !profile) return null;

  // Free users see a locked preview, not the full data.
  if (plan !== "pro") {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-manrope text-lg font-medium text-white">Your developer profile</h2>
            <p className="mt-1 font-inter text-sm text-[#A1A1AA]">
              See your strengths, weaknesses, and personalized growth path — computed from your real coding history.
            </p>
          </div>
          <ProUpsell feature="Developer Profile" />
        </div>
        {/* Blurred preview — shows there's something here without giving it away */}
        <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 blur-sm select-none pointer-events-none">
          <div className="flex flex-col gap-2">
            <div className="h-3 w-24 rounded bg-white/10" />
            <div className="h-2 w-full rounded bg-white/5" />
            <div className="h-2 w-3/4 rounded bg-white/5" />
          </div>
        </div>
        <p className="font-inter text-xs text-neutral-600 text-center">
          Upgrade to Pro to unlock your full developer profile.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
      <div>
        <h2 className="font-manrope text-lg font-medium text-white">Your developer profile</h2>
        <p className="mt-1 font-inter text-sm text-[#A1A1AA]">{profile.summary}</p>
      </div>

      {profile.strengths.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-manrope text-xs font-medium uppercase tracking-wider text-neutral-500">Strengths</h3>
          <div className="flex flex-col gap-2">
            {profile.strengths.map((s) => (
              <div key={s.title} className="flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <TrendingUp size={15} className="mt-0.5 shrink-0 text-[#60A5FA]" />
                <div>
                  <p className="font-manrope text-sm font-medium text-white">{s.title}</p>
                  <p className="mt-0.5 font-inter text-[13px] leading-relaxed text-[#A1A1AA]">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.weaknesses.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-manrope text-xs font-medium uppercase tracking-wider text-neutral-500">Growth edges</h3>
          <div className="flex flex-col gap-2">
            {profile.weaknesses.map((w) => (
              <div key={w.title} className="flex items-start gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
                <TrendingDown size={15} className="mt-0.5 shrink-0 text-amber-400" />
                <div>
                  <p className="font-manrope text-sm font-medium text-white">{w.title}</p>
                  <p className="mt-0.5 font-inter text-[13px] leading-relaxed text-[#A1A1AA]">{w.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.growthPath.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-manrope text-xs font-medium uppercase tracking-wider text-neutral-500">Recommended next steps</h3>
          <div className="flex flex-col gap-2">
            {profile.growthPath.map((step, i) => (
              <div key={step.title} className="flex items-start gap-3 rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/[0.04] p-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]/20 text-[11px] font-bold text-[#60A5FA]">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-manrope text-sm font-medium text-white">{step.title}</p>
                    <span className="shrink-0 font-mono text-[11px] text-neutral-500">
                      ~{step.estimatedSessions} {step.estimatedSessions === 1 ? "session" : "sessions"}
                    </span>
                  </div>
                  <p className="mt-0.5 font-inter text-[13px] leading-relaxed text-[#A1A1AA]">{step.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
