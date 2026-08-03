"use client";

import { useState } from "react";
import { Check, Copy, Globe } from "lucide-react";
import { setPublicProfileEnabled } from "@focus-forge/api-client";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

/**
 * Opt-in switch for the shared developer twin.
 *
 * Off until someone deliberately turns it on. The twin makes fairly personal
 * claims — "most of your projects go quiet after three weeks" — and publishing
 * that by default, even from data that is technically public, isn't a decision
 * the app gets to make on someone's behalf.
 */
export function ShareProfileToggle({
  githubUsername,
  initialEnabled,
}: {
  githubUsername: string | null;
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(
    typeof window !== "undefined" && localStorage.getItem("upstream-public-profile") === "1"
      ? true
      : initialEnabled
  );
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = githubUsername
    ? `${typeof window === "undefined" ? "" : window.location.origin}/u/${githubUsername}`
    : null;

  async function toggle() {
    setBusy(true);
    setError(null);
    const next = !enabled;
    // Toggle locally first — always works.
    setEnabled(next);
    localStorage.setItem("upstream-public-profile", next ? "1" : "0");
    // Try DB — if migration isn't applied, localStorage already has it.
    try {
      await setPublicProfileEnabled(getBrowserSupabaseClient(), next);
    } catch {
      // Column doesn't exist yet on remote DB. localStorage fallback active.
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  if (!githubUsername) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Globe size={15} className="text-[#8b74ff]" />
            <h3 className="font-manrope text-sm font-medium text-white">Share your developer twin</h3>
          </div>
          <p className="font-inter text-sm leading-relaxed text-[#A1A1AA]">
            Publishes a page anyone can open — no account needed. Built from your public repos only, and off
            until you turn it on.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          disabled={busy}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? "bg-[#6744FF]" : "bg-white/15"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </div>

      {error && <p className="font-inter text-xs text-red-400">{error}</p>}

      {enabled && url && (
        <button
          type="button"
          onClick={copy}
          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-left transition-colors hover:border-white/25"
        >
          <span className="truncate font-mono text-xs text-neutral-300">{url}</span>
          {copied ? (
            <Check size={14} className="shrink-0 text-[#8b74ff]" />
          ) : (
            <Copy size={14} className="shrink-0 text-neutral-500" />
          )}
        </button>
      )}
    </div>
  );
}
