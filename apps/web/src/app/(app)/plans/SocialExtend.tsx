"use client";

import { ExternalLink } from "lucide-react";

/**
 * Social media extension for the free trial.
 * Follow on Instagram or X (Twitter) to get an extra 14 days of Pro.
 *
 * This is a manual/trust-based flow — no OAuth needed. The user clicks the link,
 * then clicks "I followed" to claim their extension. A server-side check could
 * be added later via social media APIs, but for launch this keeps it simple.
 */
export function SocialExtend() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-amber-400/20 bg-amber-400/[0.04] p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-2xl">🎁</span>
        <div>
          <h3 className="font-manrope text-sm font-medium text-white">Extend your trial by 14 days</h3>
          <p className="mt-1 font-inter text-sm leading-relaxed text-[#A1A1AA]">
            Follow us on Instagram or X (Twitter), then click below. We{"'"}ll add two more weeks
            of Pro to your account — no credit card, no strings attached. We just want you to
            have enough time to see what the AI mentor can do.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href="https://instagram.com/upstreamdev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-inter text-sm text-white transition-colors hover:bg-white/[0.08]"
        >
          <ExternalLink size={14} />
          Follow on Instagram
        </a>
        <a
          href="https://x.com/upstreamdev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-inter text-sm text-white transition-colors hover:bg-white/[0.08]"
        >
          <ExternalLink size={14} />
          Follow on X
        </a>
        <a
          href="/api/plans/extend-trial"
          className="flex items-center gap-2 rounded-xl bg-amber-400/20 px-4 py-2.5 font-manrope text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-400/30"
        >
          I followed — extend my trial
        </a>
      </div>

      <p className="font-inter text-[11px] text-neutral-600">
        We trust you. No verification — if you say you followed, that{"'"}s good enough for us.
        Building an audience helps us keep the lights on, and 28 days is enough time to fall
        in love with the product.
      </p>
    </div>
  );
}
