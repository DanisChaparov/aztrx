import { BILLING_LIVE, type Plan } from "@aztrx/core";
import { Sparkles } from "lucide-react";

/**
 * Shows which tier an account is on.
 *
 * While billing is off, a free account shows nothing — a "Free" tag next to
 * every feature that is currently free anyway just implies a wall that isn't
 * there. Only "Pro" is worth labelling, because it explains why that account
 * sees things others won't once billing is on.
 */
export function PlanBadge({ plan }: { plan: Plan }) {
  if (plan !== "pro") return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[#3B82F6]/40 bg-[#3B82F6]/15 px-2.5 py-1 font-inter text-[11px] font-medium text-[#93C5FD]"
      title={BILLING_LIVE ? "Pro plan" : "Pro plan — billing isn't live yet, so everyone has these features"}
    >
      <Sparkles size={11} />
      Pro
    </span>
  );
}
