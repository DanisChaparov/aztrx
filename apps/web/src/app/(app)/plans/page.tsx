import { Sparkles, AlertTriangle } from "lucide-react";
import { getPlan } from "@focus-forge/api-client";
import { BILLING_LIVE } from "@focus-forge/core";
import { TrialBanner } from "./TrialBanner";
import { SocialExtend } from "./SocialExtend";
import { FeatureComparisonTable, PlanCards } from "./PlansClient";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const FREE_FEATURES = [
  { name: "Focus sessions & verification", included: true },
  { name: "GitHub commit verification", included: true },
  { name: "Distraction blocking (desktop + extension)", included: true },
  { name: "Coding streaks & heatmap", included: true },
  { name: "Developer Twin (private + public share)", included: true },
  { name: "AI assistant via your Claude Code", included: true },
  { name: "5 built-in AI mentor interactions/day", included: true },
  { name: "3 active projects", included: true },
  { name: "90-day history", included: true },
  { name: "Ambient activity tracking", included: false },
  { name: "Developer Profile (strengths/weaknesses)", included: false },
  { name: 'Monthly "Wrapped" reports', included: false },
  { name: "Yearly report with growth trajectory", included: false },
  { name: "Skill graph & learning path", included: false },
  { name: "Private repo verification", included: false },
  { name: "15 AI mentor interactions/day", included: false },
  { name: "Exportable proof of hours", included: false },
  { name: "Ambient timeline", included: false },
];

export default async function PlansPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; trial?: string }>;
}) {
  const supabase = await getServerSupabaseClient();
  const plan = await getPlan(supabase);
  const { error: errorMsg, trial } = await searchParams;

  // Check trial eligibility from the profiles table
  const { data: userData } = await supabase.auth.getUser();
  let trialUsed = false;
  let trialEndsAt: string | null = null;
  if (userData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("trial_ends_at")
      .eq("id", userData.user.id)
      .single();
    if (profile?.trial_ends_at) {
      const endsAt = new Date(profile.trial_ends_at);
      if (endsAt > new Date()) {
        trialEndsAt = profile.trial_ends_at;
      } else {
        trialUsed = true;
      }
    }
  }

  const isPro = plan === "pro";
  const hasActiveTrial = trialEndsAt !== null;
  const billingNote = BILLING_LIVE
    ? undefined
    : "Billing isn't live yet — everyone has Pro features for now. When payment launches, you'll keep your current plan.";

  return (
    <div className="flex flex-col gap-10 pt-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-instrument-serif text-3xl text-white">Plans</h1>
        <p className="font-inter text-sm text-[#A1A1AA]">
          Free forever for the core. Pro for the insight layer — the AI that actually knows your work.
        </p>
      </div>

      {billingNote && (
        <div className="rounded-2xl border border-[#6744FF]/20 bg-[#6744FF]/[0.06] p-4">
          <p className="flex items-center gap-2 font-inter text-sm text-[#A1A1AA]">
            <Sparkles size={15} className="shrink-0 text-[#8b74ff]" />
            {billingNote}
          </p>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4">
          <p className="flex items-center gap-2 font-inter text-sm text-red-400">
            <AlertTriangle size={15} />
            {errorMsg}
          </p>
        </div>
      )}

      {trial === "started" && (
        <div className="rounded-2xl border border-green-400/20 bg-green-400/[0.06] p-4">
          <p className="flex items-center gap-2 font-inter text-sm text-green-400">
            <Sparkles size={15} />
            Trial started! You have 14 days of Pro features. No credit card needed.
          </p>
        </div>
      )}

      {trial === "extended" && (
        <div className="rounded-2xl border border-green-400/20 bg-green-400/[0.06] p-4">
          <p className="flex items-center gap-2 font-inter text-sm text-green-400">
            <Sparkles size={15} />
            Trial extended by 14 days! Thanks for following us — enjoy Pro.
          </p>
        </div>
      )}

      {hasActiveTrial && (
        <TrialBanner endsAt={trialEndsAt!} />
      )}

      {/* Price cards */}
      <PlanCards
        plan={plan}
        hasActiveTrial={hasActiveTrial}
        isPro={isPro}
        features={FREE_FEATURES}
      />

      {/* Social extension for trial */}
      {!isPro && !hasActiveTrial && !trialUsed && (
        <SocialExtend />
      )}

      {trialUsed && !isPro && !hasActiveTrial && (
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-6">
          <div className="flex items-start gap-3">
            <Sparkles size={18} className="mt-0.5 shrink-0 text-amber-400" />
            <div>
              <h3 className="font-manrope text-sm font-medium text-white">Your trial ended</h3>
              <p className="mt-1 font-inter text-sm text-[#A1A1AA]">
                You can still extend it by 14 days — follow us on Instagram or X and we'll add two more weeks of Pro.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Feature comparison table */}
      <div className="flex flex-col gap-3">
        <h2 className="font-manrope text-lg font-medium text-white">Full comparison</h2>
        <p className="font-inter text-xs text-neutral-500 -mt-1">
          Click any feature to learn what it does and how to use it.
        </p>
        <FeatureComparisonTable features={FREE_FEATURES} />
      </div>

      {/* FAQ */}
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
        <h2 className="font-manrope text-lg font-medium text-white">Frequently asked questions</h2>
        <div className="flex flex-col gap-4">
          {[
            { q: "Why $8/month?", a: "It's below the $10 psychological barrier, comparable to GitHub Copilot, and covers the AI token costs (about $0.20–$0.50/user/month for Haiku-grade responses). The remaining $7.50 funds development, infra, and the impact ledger." },
            { q: "Can I use my own AI key instead?", a: "Yes — free users can provide their own Anthropic API key to unlock the full AI mentor at no cost. If you have Claude Code installed, the desktop app uses your existing subscription automatically." },
            { q: "What happens when my trial ends?", a: "You keep all your data. AI mentor features, ambient tracking, reports, and the developer profile become read-only until you upgrade. Your sessions and streaks continue uninterrupted." },
            { q: "Can I cancel anytime?", a: "Yes. No contracts, no cancellation fees. If you cancel, you keep Pro features until the end of your billing period, then revert to Free." },
            { q: "Do you offer student discounts?", a: "Not yet — but we plan to. If you have a .edu email, reach out and we'll set you up." },
          ].map((faq) => (
            <div key={faq.q} className="flex flex-col gap-1">
              <h3 className="font-manrope text-sm font-medium text-white">{faq.q}</h3>
              <p className="font-inter text-sm leading-relaxed text-[#A1A1AA]">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
