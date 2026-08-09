"use client";

import { useState } from "react";
import { Check, Minus, Clock, MessageCircle } from "lucide-react";
import { FEATURE_STATUS, limitFor } from "@focus-forge/core";
import { toFeatureKey } from "@/lib/plan-features";
import { FeatureTutorial } from "./FeatureTutorial";
import { PlanCard } from "./PlanCard";
import { PolarButton } from "@/components/PolarButton";
import type { ReactNode } from "react";

interface Feature {
  name: string;
  included: boolean;
}

function isFeatureComingSoon(name: string): boolean {
  const key = toFeatureKey(name);
  if (!key) return false;
  return FEATURE_STATUS[key as keyof typeof FEATURE_STATUS] === "coming-soon";
}

/**
 * Client-side wrapper for the feature comparison table — makes rows clickable
 * to open the FeatureTutorial modal, and shows "Coming soon" badges.
 */
export function FeatureComparisonTable({ features }: { features: Feature[] }) {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="px-5 py-3 text-left font-manrope text-sm font-medium text-white">Feature</th>
              <th className="px-5 py-3 text-center font-manrope text-sm font-medium text-neutral-400">Free</th>
              <th className="px-5 py-3 text-center font-manrope text-sm font-medium text-[#60A5FA]">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {features.map((feature) => {
              const comingSoon = isFeatureComingSoon(feature.name);
              return (
                <tr
                  key={feature.name}
                  className="hover:bg-white/[0.02] cursor-pointer transition-colors group"
                  onClick={() => setSelectedFeature(feature.name)}
                >
                  <td className="px-5 py-3 font-inter text-sm text-neutral-300 group-hover:text-white transition-colors">
                    {feature.name}
                    {comingSoon && (
                      <span className="ml-2 inline-flex shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-manrope text-[9px] font-bold uppercase tracking-wider text-amber-400/80">
                        Soon
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {feature.included ? (
                      <Check size={15} className="mx-auto text-neutral-400" />
                    ) : (
                      <Minus size={15} className="mx-auto text-neutral-700" />
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {comingSoon ? (
                      <Clock size={15} className="mx-auto text-amber-400/60" />
                    ) : (
                      <Check size={15} className="mx-auto text-[#60A5FA]" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedFeature && (
        <FeatureTutorial
          feature={selectedFeature}
          open={true}
          onClose={() => setSelectedFeature(null)}
        />
      )}
    </>
  );
}

/**
 * Hook to use in the parent page — returns the onFeatureClick handler and the
 * FeatureTutorial modal.
 */
export function useFeatureTutorial() {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  return {
    selectedFeature,
    onFeatureClick: (feature: string) => setSelectedFeature(feature),
    tutorialModal: selectedFeature ? (
      <FeatureTutorial
        feature={selectedFeature}
        open={true}
        onClose={() => setSelectedFeature(null)}
      />
    ) : null,
  };
}

/**
 * Mini usage bar showing how many AI interactions the user has used today.
 * Only shown when the user has no API key (i.e. they're using Upstream's quota).
 */
export function UsageDisplay({
  usedToday,
  dailyLimit,
  hasApiKey,
}: {
  usedToday: number;
  dailyLimit: number;
  hasApiKey: boolean;
}) {
  if (hasApiKey) return null; // using their own key — unlimited

  const pct = Math.min(100, Math.round((usedToday / dailyLimit) * 100));
  const remaining = Math.max(0, dailyLimit - usedToday);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0e0f14] p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageCircle size={15} className="text-[#60A5FA]" />
          <span className="font-manrope text-sm font-medium text-white">AI mentor usage today</span>
        </div>
        <span className="font-inter text-xs text-[#A1A1AA]">
          {usedToday} / {dailyLimit} interactions
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full transition-all ${
            pct >= 100 ? "bg-red-400" : pct >= 70 ? "bg-amber-400" : "bg-[#3B82F6]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 font-inter text-xs text-neutral-500">
        {remaining > 0
          ? `${remaining} interaction${remaining !== 1 ? "s" : ""} remaining today.`
          : "Limit reached — upgrade to Pro for 15/day or add your API key."}
      </p>
    </div>
  );
}

/**
 * Client wrapper that renders the two PlanCard components with feature-click
 * handling and the FeatureTutorial modal.
 */
export function PlanCards({
  plan,
  hasActiveTrial,
  isPro,
  features,
  usageToday,
  hasApiKey,
}: {
  plan: string;
  hasActiveTrial: boolean;
  isPro: boolean;
  features: Feature[];
  usageToday?: number;
  hasApiKey?: boolean;
}) {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2">
        <PlanCard
          name="Free"
          price="$0"
          period="forever"
          description="Everything you need to track, verify, and prove your work. No credit card, no time limit."
          features={features}
          current={plan === "free" && !hasActiveTrial}
          action={
            plan === "free" && !hasActiveTrial
              ? { label: "Your current plan", disabled: true }
              : { label: "Downgrade to Free", href: "/api/plans/switch?to=free" }
          }
          variant="free"
          onFeatureClick={(feature) => setSelectedFeature(feature)}
        />

        <PlanCard
          name="Pro"
          price="$8"
          period="per month"
          annualPrice="$72"
          annualPeriod="per year"
          description="Your personal AI mentor. Knows how you code, what you're learning, your strengths, your weaknesses, and what to do next."
          features={features}
          current={isPro || hasActiveTrial}
          highlight
          action={
            isPro
              ? { label: "Your current plan", disabled: true }
              : hasActiveTrial
              ? { label: "Trial active", disabled: true }
              : { label: "Start 14-day free trial", href: "/api/plans/trial" }
          }
          variant="pro"
          onFeatureClick={(feature) => setSelectedFeature(feature)}
        />
      </div>

      {/* Direct subscribe — Lemon Squeezy hosted checkout, works worldwide */}
      {!isPro && (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
          <div className="text-center">
            <span className="font-manrope text-sm font-semibold text-white">Ready to commit?</span>
            <p className="mt-1 font-inter text-xs text-[#A1A1AA]">
              Skip the trial and subscribe directly — cancel anytime.
            </p>
          </div>
          <div className="flex gap-3 w-full max-w-sm">
            <PolarButton
              variant="monthly"
              label="Subscribe Monthly — $8"
              className="flex-1"
            />
            <PolarButton
              variant="yearly"
              label="Subscribe Yearly — $72"
              className="flex-1"
            />
          </div>
          <p className="font-inter text-[11px] text-neutral-600">
            Payments handled by Polar.sh — VAT included, no country restrictions.
          </p>
        </div>
      )}

      {selectedFeature && (
        <FeatureTutorial
          feature={selectedFeature}
          open={true}
          onClose={() => setSelectedFeature(null)}
        />
      )}
    </>
  );
}
