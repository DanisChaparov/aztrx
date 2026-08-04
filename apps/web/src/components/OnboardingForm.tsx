"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateProfile } from "@focus-forge/api-client";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

const DONE_KEY = "upstream-onboarding-done";
const NAME_KEY = "upstream-display-name";

export function OnboardingForm() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
    const forceShow = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("onboard");
    if (forceShow) {
      localStorage.removeItem(DONE_KEY);
      localStorage.removeItem(NAME_KEY);
    }
    if (localStorage.getItem(DONE_KEY) === "1" && !forceShow) return;
    const supabase = getBrowserSupabaseClient();
    getProfile(supabase)
      .then((p) => {
        if (p.email) setEmail(p.email);
        setName(localStorage.getItem(NAME_KEY) || p.displayName || "");
      })
      .catch(() => {});
  }, []);

  if (!mounted) return null;
  if (localStorage.getItem(DONE_KEY) === "1") return null;

  async function finish() {
    setBusy(true);
    if (name.trim()) localStorage.setItem(NAME_KEY, name.trim());

    try {
      await updateProfile(getBrowserSupabaseClient(), {
        displayName: name.trim() || undefined,
      });
    } catch { /* localStorage saved */ }

    localStorage.setItem(DONE_KEY, "1");
    setBusy(false);
    router.refresh();
  }

  function skip() {
    if (name.trim()) localStorage.setItem(NAME_KEY, name.trim());
    localStorage.setItem(DONE_KEY, "1");
    router.refresh();
  }

  const inputClass =
    "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-inter text-sm text-white outline-none transition-colors focus:border-[#3B82F6]";

  return (
    <div className="rounded-2xl border border-[#3B82F6]/20 bg-[#0e0f14] p-6">
      <div className="mb-4">
        <h2 className="font-manrope text-lg font-medium text-white">Welcome to Upstream</h2>
        <p className="mt-1 font-inter text-sm text-[#A1A1AA]">
          Quick setup. What should we call you?
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-manrope text-xs text-neutral-400">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className={inputClass}
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") finish(); }}
          />
        </div>

        {email && (
          <p className="font-inter text-xs text-neutral-500">
            Signed in as <span className="text-neutral-300">{email}</span>
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={finish}
            disabled={busy}
            className="rounded-xl bg-[#3B82F6] px-6 py-2.5 font-manrope text-sm font-semibold text-white transition-colors hover:bg-[#3B82F6]/90 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save & continue"}
          </button>
          <button
            onClick={skip}
            className="rounded-xl border border-white/10 px-6 py-2.5 font-manrope text-sm text-neutral-400 transition-colors hover:text-white"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
