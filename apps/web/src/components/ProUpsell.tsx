"use client";

import { Sparkles } from "lucide-react";

/**
 * A tasteful upsell shown in place of Pro-gated features.
 * Not a popup, not a nag — a card in the natural content flow that describes
 * what Pro unlocks.
 */
export function ProUpsell({ feature }: { feature: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/[0.06] px-3 py-2">
      <Sparkles size={14} className="shrink-0 text-[#60A5FA]" />
      <span className="font-manrope text-xs text-[#A1A1AA]">
        <span className="font-semibold text-white">{feature}</span> is a Pro feature
      </span>
    </div>
  );
}
