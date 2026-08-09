"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

const CONFIRM_TEXT = "DELETE";

export function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (confirmInput !== CONFIRM_TEXT) return;
    setDeleting(true);
    setError("");

    try {
      const supabase = getBrowserSupabaseClient();
      // RPC function will exist once migration 0022 is applied
      const { error: rpcError } = await (supabase.rpc as any)("delete_user_account");
      if (rpcError) {
        setError(rpcError.message);
        setDeleting(false);
        return;
      }
      // Sign out and redirect to login
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete account.");
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-red-400/20 bg-[#0e0f14] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-400" />
            <h2 className="font-manrope text-base font-semibold text-white">Delete account</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <p className="font-inter text-sm leading-relaxed text-[#A1A1AA]">
            This permanently deletes <strong className="text-white">all your data</strong>:
            focus sessions, projects, profile, streaks, and achievements.
            There is no undo.
          </p>

          <p className="font-inter text-xs text-neutral-500">
            Type <code className="text-red-400 font-mono">DELETE</code> to confirm.
          </p>

          <input
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="Type DELETE"
            className="rounded-xl border border-red-400/20 bg-red-400/[0.04] px-4 py-2.5 font-mono text-sm text-white outline-none transition-colors focus:border-red-400 w-full placeholder:text-neutral-500"
            autoFocus
          />

          {error && (
            <p className="font-inter text-xs text-red-400 bg-red-400/5 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-manrope text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirmInput !== CONFIRM_TEXT || deleting}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 font-manrope text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
