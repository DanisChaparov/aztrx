"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@focus-forge/api-client";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

const NAME_KEY = "upstream-display-name";
const EMAIL_KEY = "upstream-email";

interface ProfileData {
  displayName: string | null;
  email: string | null;
  notifySessionComplete: boolean;
  notifyDeadline: boolean;
  notifyAchievement: boolean;
  notifyStreakRisk: boolean;
}

export function SettingsForm({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [name, setName] = useState(localStorage.getItem(NAME_KEY) || profile.displayName || "");
  const [email, setEmail] = useState(localStorage.getItem(EMAIL_KEY) || profile.email || "");
  const [notifySession, setNotifySession] = useState(profile.notifySessionComplete);
  const [notifyDeadline, setNotifyDeadline] = useState(profile.notifyDeadline);
  const [notifyAchievement, setNotifyAchievement] = useState(profile.notifyAchievement);
  const [notifyStreak, setNotifyStreak] = useState(profile.notifyStreakRisk);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    if (name.trim()) localStorage.setItem(NAME_KEY, name.trim());
    if (email.trim()) localStorage.setItem(EMAIL_KEY, email.trim());

    try {
      await updateProfile(getBrowserSupabaseClient(), {
        displayName: name.trim() || undefined,
        notifySessionComplete: notifySession,
        notifyDeadline,
        notifyAchievement,
        notifyStreakRisk: notifyStreak,
      });
    } catch { /* localStorage saved */ }

    setSaved(true);
    setSaving(false);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  const inputClass =
    "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-inter text-sm text-white outline-none transition-colors focus:border-[#6744FF]";

  const toggleClass = (enabled: boolean) =>
    `relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? "bg-[#6744FF]" : "bg-white/15"}`;

  return (
    <form onSubmit={save} className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
        <h2 className="font-manrope text-sm font-medium text-white">Profile</h2>
        <div className="flex flex-col gap-1.5">
          <label className="font-manrope text-xs text-neutral-400">Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-manrope text-xs text-neutral-400">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" className={inputClass} />
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
        <h2 className="font-manrope text-sm font-medium text-white">Notifications</h2>
        {[
          { label: "Session completed", desc: "When a focus session finishes", value: notifySession, set: setNotifySession },
          { label: "Deadline approaching", desc: "24h and 1h before deadline", value: notifyDeadline, set: setNotifyDeadline },
          { label: "Achievement unlocked", desc: "When you earn an achievement", value: notifyAchievement, set: setNotifyAchievement },
          { label: "Streak at risk", desc: "When streak is about to break", value: notifyStreak, set: setNotifyStreak },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <div><p className="font-inter text-sm text-white">{item.label}</p><p className="font-inter text-xs text-neutral-500">{item.desc}</p></div>
            <button type="button" role="switch" aria-checked={item.value} onClick={() => item.set(!item.value)} className={toggleClass(item.value)}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${item.value ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </div>

      <button type="submit" disabled={saving}
        className="self-start rounded-xl bg-[#6744FF] px-6 py-2.5 font-manrope text-sm font-semibold text-white transition-colors hover:bg-[#6744FF]/90 disabled:opacity-50">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
      </button>
    </form>
  );
}
