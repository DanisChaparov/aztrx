"use client";

import { useState } from "react";
import { Check, Minus, Clock } from "lucide-react";
import { FEATURE_STATUS } from "@focus-forge/core";
import { FeatureTutorial } from "./FeatureTutorial";
import { PlanCard } from "./PlanCard";
import type { ReactNode } from "react";

interface Feature {
  name: string;
  included: boolean;
}

/** Map plan feature names to PlanFeatures keys for status lookup */
function toFeatureKey(name: string): string | null {
  const map: Record<string, string> = {
    "Focus sessions & verification": "aiMentorInteractionsPerDay",
    "GitHub commit verification": "aiMentorInteractionsPerDay",
    "Distraction blocking (desktop + extension)": "aiMentorInteractionsPerDay",
    "Coding streaks & heatmap": "aiMentorInteractionsPerDay",
    "Developer Twin (private + public share)": "aiMentorInteractionsPerDay",
    "AI assistant via your Claude Code": "assistantFollowUps",
    "5 built-in AI mentor interactions/day": "aiMentorInteractionsPerDay",
    "3 active projects": "maxProjects",
    "90-day history": "historyDays",
    "Ambient activity tracking": "ambientTracking",
    "Developer Profile (strengths/weaknesses)": "developerProfile",
    'Monthly "Wrapped" reports': "monthlyReport",
    "Yearly report with growth trajectory": "yearlyReport",
    "Skill graph & learning path": "skillGraph",
    "Private repo verification": "privateRepoVerification",
    "15 AI mentor interactions/day": "aiMentorInteractionsPerDay",
    "Exportable proof of hours": "exportableProof",
    "Ambient timeline": "ambientTimeline",
  };
  return map[name] ?? null;
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
              <th className="px-5 py-3 text-center font-manrope text-sm font-medium text-[#8b74ff]">Pro</th>
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
                      <Check size={15} className="mx-auto text-[#8b74ff]" />
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
 * Client wrapper that renders the two PlanCard components with feature-click
 * handling and the FeatureTutorial modal.
 */
export function PlanCards({
  plan,
  hasActiveTrial,
  isPro,
  features,
}: {
  plan: string;
  hasActiveTrial: boolean;
  isPro: boolean;
  features: Feature[];
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
