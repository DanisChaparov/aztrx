"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { updateProfile } from "@focus-forge/api-client";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { ApiKeyInput } from "@/components/ApiKeyInput";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { DeleteAccountModal } from "@/components/DeleteAccountModal";

const NAME_KEY = "upstream-display-name";
const EMAIL_KEY = "upstream-email";

interface ProfileData {
  displayName: string | null;
  email: string | null;
  notifySessionComplete: boolean;
  notifyDeadline: boolean;
  notifyAchievement: boolean;
  notifyStreakRisk: boolean;
  themePreference: string | null;
  website: string | null;
  twitter: string | null;
}

export function SettingsForm({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [name, setName] = useState(localStorage.getItem(NAME_KEY) || profile.displayName || "");
  const [email, setEmail] = useState(localStorage.getItem(EMAIL_KEY) || profile.email || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [twitterHandle, setTwitterHandle] = useState(profile.twitter || "");
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
      const supabase = getBrowserSupabaseClient();
      const { data } = await supabase.auth.getUser();
      await updateProfile(supabase, {
        displayName: name.trim() || undefined,
        notifySessionComplete: notifySession,
        notifyDeadline,
        notifyAchievement,
        notifyStreakRisk: notifyStreak,
      });
      // Save website + twitter (may fail if columns don't exist yet — non-fatal)
      if (data.user) {
        await (supabase.from("profiles") as any).upsert({
          id: data.user.id,
          website: website.trim() || null,
          twitter: twitterHandle.trim() || null,
        }).catch(() => {});
      }
    } catch { /* localStorage saved */ }

    setSaved(true);
    setSaving(false);
    router.refresh();
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const supabase = getBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [sessions, projects, profileData] = await Promise.all([
        supabase.from("focus_sessions").select("*").eq("user_id", user.id).order("started_at", { ascending: false }).limit(5000),
        supabase.from("projects").select("*").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);

      const blob = new Blob(
        [JSON.stringify({
          exportedAt: new Date().toISOString(),
          user: { email: user.email, id: user.id },
          profile: profileData.data,
          sessions: sessions.data,
          projects: projects.data,
        }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `upstream-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  const inputClass =
    "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-inter text-sm text-white outline-none transition-colors focus:border-[#3B82F6]";

  const toggleClass = (enabled: boolean) =>
    `relative h-6 w-11 shrink-0 rounded-full transition-colors ${enabled ? "bg-[#3B82F6]" : "bg-white/15"}`;

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
        <div className="flex flex-col gap-1.5">
          <label className="font-manrope text-xs text-neutral-400">Website</label>
          <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://your-site.com" className={inputClass} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="font-manrope text-xs text-neutral-400">X / Twitter handle</label>
          <input value={twitterHandle} onChange={(e) => setTwitterHandle(e.target.value)} placeholder="yourhandle" className={inputClass} />
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

      {/* API key — lets free users bring their own Anthropic key */}
      <ApiKeyInput />

      {/* Display */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
        <h2 className="font-manrope text-sm font-medium text-white">Display</h2>
        <ThemeToggle initialTheme={profile.themePreference} />
      </div>

      {/* Password */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
        <h2 className="font-manrope text-sm font-medium text-white">Password</h2>
        <PasswordChangeForm />
      </div>

      {/* Data export */}
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0e0f14] p-6">
        <h2 className="font-manrope text-sm font-medium text-white">Export my data</h2>
        <p className="font-inter text-sm text-[#A1A1AA]">
          Download all your data as a JSON file — sessions, projects, profile, and settings.
        </p>
        <button
          type="button"
          onClick={handleExportData}
          disabled={exporting}
          className="flex items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 font-manrope text-sm font-medium text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50"
        >
          <Download size={14} />
          {exporting ? "Exporting…" : "Download my data"}
        </button>
      </div>

      {/* Delete account */}
      <div className="flex flex-col gap-4 rounded-2xl border border-red-400/20 bg-[#0e0f14] p-6">
        <h2 className="font-manrope text-sm font-medium text-red-400">Danger zone</h2>
        <p className="font-inter text-sm text-[#A1A1AA]">
          Permanently delete your account and all data. There is no undo.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center justify-center gap-2 self-start rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-2.5 font-manrope text-sm font-medium text-red-400 transition-colors hover:bg-red-400/20"
        >
          <Trash2 size={14} />
          Delete account
        </button>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />
      )}

      {/* Privacy notice */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#0e0f14] p-6">
        <h2 className="font-manrope text-sm font-medium text-white mb-3">Privacy &amp; Security</h2>
        <ul className="flex flex-col gap-2 font-inter text-sm text-[#A1A1AA] leading-relaxed">
          <li>• <strong className="text-white">Passwords are hashed with bcrypt</strong> — nobody, not even us, can see your password. If the database leaked, passwords would still be unreadable.</li>
          <li>• <strong className="text-white">API keys never touch our servers</strong> — stored in your browser's localStorage, sent directly to AI providers. We cannot see them.</li>
          <li>• <strong className="text-white">Desktop app needs zero keys</strong> — it uses your local Claude Code installation. Nothing leaves your machine.</li>
          <li>• Your activity data is computed <strong className="text-white">locally on your device</strong> — only anonymized hourly buckets leave your machine.</li>
          <li>• Session verification checks GitHub for commits you made — we <strong className="text-white">never ask for write access</strong> to your repos.</li>
          <li>• Your developer twin is <strong className="text-white">opt-in only</strong>. Nothing is public unless you explicitly enable it.</li>
          <li>• Source code is <strong className="text-white">fully open source</strong> — audit what the app does at{" "}
            <a href="https://github.com/DanisChaparov/upstream-app" target="_blank" rel="noopener" className="text-[#60A5FA] underline">github.com/DanisChaparov/upstream-app</a>.</li>
          <li>• <strong className="text-white">Never any ads, never any data selling.</strong> Funded by Pro subscriptions.</li>
        </ul>
      </div>

      <button type="submit" disabled={saving}
        className="self-start rounded-xl bg-[#3B82F6] px-6 py-2.5 font-manrope text-sm font-semibold text-white transition-colors hover:bg-[#3B82F6]/90 disabled:opacity-50">
        {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
      </button>
    </form>
  );
}
