"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export function PasswordChangeForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const supabase = getBrowserSupabaseClient();
      // Supabase requires recent authentication for password changes.
      // First re-authenticate, then update.
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: (await supabase.auth.getUser()).data.user?.email ?? "",
        password: currentPassword,
      });
      if (signInError) {
        setError("Current password is incorrect.");
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-inter text-sm text-white outline-none transition-colors focus:border-[#3B82F6] w-full";

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
        <p className="font-inter text-sm text-emerald-400">
          Password changed successfully. Use your new password next time you log in.
        </p>
        <button
          type="button"
          onClick={() => setSuccess(false)}
          className="mt-2 font-inter text-xs text-[#60A5FA] hover:underline"
        >
          Change again
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-manrope text-xs text-neutral-400">Current password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-manrope text-xs text-neutral-400">New password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
          required
          minLength={8}
          placeholder="At least 8 characters"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-manrope text-xs text-neutral-400">Confirm new password</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
          required
        />
      </div>
      {error && (
        <p className="font-inter text-xs text-red-400 bg-red-400/5 rounded-lg px-3 py-2">{error}</p>
      )}
      <button
        type="submit"
        disabled={saving || !currentPassword || !newPassword || !confirmPassword}
        className="flex items-center justify-center gap-2 self-start rounded-xl bg-[#3B82F6] px-5 py-2.5 font-manrope text-sm font-semibold text-white transition-colors hover:bg-[#3B82F6]/90 disabled:opacity-50"
      >
        <Lock size={14} />
        {saving ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}
