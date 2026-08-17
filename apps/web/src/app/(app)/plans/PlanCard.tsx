"use client";

import Link from "next/link";
import { Check, Minus, Crown, Sparkles, Clock } from "lucide-react";
import { FEATURE_STATUS } from "@aztrx/core";
import { toFeatureKey } from "@/lib/plan-features";

interface Feature {
  name: string;
  included: boolean;
}

interface PlanAction {
  label: string;
  href?: string;
  disabled?: boolean;
}

function isFeatureComingSoon(name: string): boolean {
  const key = toFeatureKey(name);
  if (!key) return false;
  return FEATURE_STATUS[key as keyof typeof FEATURE_STATUS] === "coming-soon";
}

export function PlanCard({
  name,
  price,
  period,
  annualPrice,
  annualPeriod,
  description,
  features,
  current,
  highlight,
  action,
  variant,
  onFeatureClick,
}: {
  name: string;
  price: string;
  period: string;
  annualPrice?: string;
  annualPeriod?: string;
  description: string;
  features: Feature[];
  current?: boolean;
  highlight?: boolean;
  action: PlanAction;
  variant: "free" | "pro";
  onFeatureClick?: (featureName: string) => void;
}) {
  const showProFeatures = variant === "pro";
  const borderClass = highlight
    ? "border-[#3B82F6]/40 ring-1 ring-[#3B82F6]/20"
    : "border-white/10";

  return (
    <div className={`relative flex flex-col gap-5 rounded-2xl ${borderClass} bg-[#0e0f14] p-6`}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3B82F6] px-4 py-1">
          <span className="font-manrope text-[11px] font-bold uppercase tracking-wider text-white">
            Most popular
          </span>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="font-manrope text-xl font-bold text-white">{name}</h3>
          {variant === "pro" && <Crown size={16} className="text-[#60A5FA]" />}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-instrument-serif text-4xl font-bold text-white">{price}</span>
          <span className="font-inter text-sm text-[#A1A1AA]">/{period}</span>
        </div>
        {annualPrice && annualPeriod && (
          <p className="font-inter text-xs text-[#60A5FA]">
            {annualPrice} {annualPeriod} — save 25%
          </p>
        )}
      </div>

      <p className="font-inter text-sm leading-relaxed text-[#A1A1AA]">{description}</p>

      {action.href ? (
        <Link
          href={action.href}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 font-manrope text-sm font-semibold transition-all ${
            variant === "pro"
              ? "bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 shadow-lg shadow-[#3B82F6]/20"
              : "border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
          }`}
        >
          {variant === "pro" && <Sparkles size={15} />}
          {action.label}
        </Link>
      ) : (
        <button
          disabled={action.disabled}
          className={`flex items-center justify-center gap-2 rounded-xl py-3 font-manrope text-sm font-semibold transition-all ${
            current
              ? "border border-[#3B82F6]/30 bg-[#3B82F6]/[0.08] text-[#60A5FA]"
              : "border border-white/10 bg-white/[0.03] text-neutral-500"
          }`}
        >
          {action.label}
        </button>
      )}

      {/* Feature list — compact, show only the differentiating ones */}
      <div className="flex flex-col gap-2">
        <span className="font-manrope text-[11px] font-medium uppercase tracking-wider text-neutral-500">
          {variant === "pro" ? "Everything in Free, plus:" : "Includes:"}
        </span>
        <ul className="flex flex-col gap-1.5">
          {features
            .filter((f) => (showProFeatures ? true : f.included))
            .slice(0, showProFeatures ? undefined : 7)
            .map((feature) => {
              const comingSoon = isFeatureComingSoon(feature.name);
              return (
                <li key={feature.name}>
                  <button
                    type="button"
                    onClick={() => onFeatureClick?.(feature.name)}
                    className="flex w-full items-center gap-2 text-left rounded-lg -mx-1 px-1 py-0.5 hover:bg-white/[0.04] transition-colors group"
                  >
                    {comingSoon ? (
                      <Clock size={13} className="shrink-0 text-amber-400/60" />
                    ) : feature.included ? (
                      <Check size={13} className="shrink-0 text-[#60A5FA]" />
                    ) : showProFeatures ? (
                      <Check size={13} className="shrink-0 text-[#60A5FA]" />
                    ) : (
                      <Minus size={13} className="shrink-0 text-neutral-700" />
                    )}
                    <span className={`font-inter text-[13px] group-hover:text-white transition-colors ${
                      feature.included || showProFeatures ? "text-neutral-300" : "text-neutral-600"
                    }`}>
                      {feature.name}
                    </span>
                    {comingSoon && (
                      <span className="ml-auto shrink-0 rounded-full border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-manrope text-[9px] font-bold uppercase tracking-wider text-amber-400/80">
                        Soon
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}
