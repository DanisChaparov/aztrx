"use client";

import { useEffect, useState } from "react";
import { Loader2, Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { CodingClock, LanguageSlice, ProjectLifecycle, TwinInsight } from "@aztrx/core";

interface TwinResponse {
  ready: boolean;
  reason?: string;
  lifecycle?: ProjectLifecycle;
  languages?: LanguageSlice[];
  clock?: CodingClock | null;
  insights?: TwinInsight[];
}

const TONE_STYLE: Record<TwinInsight["tone"], { icon: typeof TrendingUp; className: string; label: string }> = {
  strength: { icon: TrendingUp, className: "text-[#60A5FA]", label: "Strength" },
  weakness: { icon: TrendingDown, className: "text-amber-400", label: "Worth fixing" },
  pattern: { icon: Minus, className: "text-[#A1A1AA]", label: "Pattern" },
};

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-manrope text-2xl font-semibold text-white">{value}</span>
      <span className="font-inter text-xs text-[#A1A1AA]">{label}</span>
    </div>
  );
}

/**
 * A portrait of how the user actually codes, read out of their commit history
 * rather than out of what Aztrx has watched. It's here so a brand-new
 * account has something real to look at on day one instead of an empty
 * dashboard waiting weeks for data.
 */
export function DeveloperTwin() {
  const [data, setData] = useState<TwinResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/developer-twin")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((json: TwinResponse) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return null;

  if (!data) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
        <Loader2 size={16} className="animate-spin text-[#60A5FA]" />
        <span className="font-inter text-sm text-[#A1A1AA]">Reading your commit history…</span>
      </div>
    );
  }

  if (!data.ready || !data.lifecycle || !data.insights) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
        <p className="font-inter text-sm text-[#A1A1AA]">{data.reason ?? "Not enough commit history yet."}</p>
      </div>
    );
  }

  const { lifecycle, insights, clock, languages } = data;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
      <div>
        <h2 className="font-manrope text-lg font-medium text-white">Your developer twin</h2>
        <p className="mt-1 font-inter text-sm text-[#A1A1AA]">
          Read from your public commit history — not from anything you told us.
        </p>
      </div>

      <div className="flex flex-wrap gap-8 border-y border-white/[0.07] py-4">
        <Stat value={String(lifecycle.total)} label="projects started" />
        <Stat value={String(lifecycle.stillAlive)} label="still alive" />
        <Stat value={String(lifecycle.abandoned)} label="gone quiet" />
        {lifecycle.medianLifespanDays !== null && (
          <Stat value={`${lifecycle.medianLifespanDays}d`} label="typical lifespan" />
        )}
        {clock && <Stat value={`${clock.peakHour}:00`} label="peak coding hour" />}
        {languages && languages.length > 0 && <Stat value={languages[0].language} label="home language" />}
      </div>

      {insights.length === 0 ? (
        <p className="font-inter text-sm text-[#A1A1AA]">
          Nothing stands out strongly enough to call a pattern yet. That&apos;s deliberate — we&apos;d rather say
          nothing than guess.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {insights.map((insight) => {
            const { icon: Icon, className, label } = TONE_STYLE[insight.tone];
            return (
              <div key={insight.title} className="flex gap-3">
                <Icon size={16} className={`mt-0.5 shrink-0 ${className}`} />
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-manrope text-sm font-medium text-white">{insight.title}</h3>
                    <span className={`font-inter text-[11px] ${className}`}>{label}</span>
                  </div>
                  <p className="font-inter text-sm leading-relaxed text-[#A1A1AA]">{insight.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {lifecycle.closestToFinished.length > 0 && (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <h3 className="font-manrope text-sm font-medium text-white">Closest to finished</h3>
          <p className="mt-1 font-inter text-sm text-[#A1A1AA]">
            {lifecycle.closestToFinished.join(", ")} — these got the furthest before going quiet.
          </p>
        </div>
      )}
    </div>
  );
}
