"use client";

import { Sparkles } from "lucide-react";

export function TrialBanner({ endsAt }: { endsAt: string }) {
  const endDate = new Date(endsAt);
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86_400_000));
  const formatted = endDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="flex items-center justify-between rounded-2xl border border-[#6744FF]/30 bg-[#6744FF]/[0.08] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6744FF]/20">
          <Sparkles size={18} className="text-[#8b74ff]" />
        </div>
        <div>
          <p className="font-manrope text-sm font-medium text-white">
            Pro trial active — {daysLeft} {daysLeft === 1 ? "day" : "days"} left
          </p>
          <p className="font-inter text-sm text-[#A1A1AA]">
            Your trial ends on {formatted}. After that, you{"'"}ll revert to the Free plan.
            No charge until you subscribe.
          </p>
        </div>
      </div>
      <a
        href="/api/plans/subscribe"
        className="shrink-0 rounded-xl bg-[#6744FF] px-5 py-2.5 font-manrope text-sm font-semibold text-white transition-colors hover:bg-[#6744FF]/90"
      >
        Subscribe now
      </a>
    </div>
  );
}
