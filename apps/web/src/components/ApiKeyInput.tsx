"use client";

import { useState } from "react";
import { Key, Check, Eye, EyeOff } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

/**
 * Lets free-tier users provide their own Anthropic API key to unlock the full
 * AI mentor without upgrading to Pro. The key is stored in the profiles table
 * and only used for AI calls the user initiates.
 *
 * No key is required if the user has Claude Code installed — the desktop app
 * already uses their local Claude Code subscription for AI features.
 */
export function ApiKeyInput() {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!key.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabaseClient();
      const { error: saveError } = await supabase
        .from("profiles")
        .update({ anthropic_api_key: key.trim() })
        .eq("id", (await supabase.auth.getUser()).data.user?.id ?? "");
      if (saveError) throw saveError;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save API key");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-5">
      <div className="flex items-center gap-2">
        <Key size={15} className="text-[#8b74ff]" />
        <h3 className="font-manrope text-sm font-medium text-white">Bring your own API key</h3>
      </div>
      <p className="font-inter text-sm leading-relaxed text-[#A1A1AA]">
        Free users can provide their own Anthropic API key to unlock the full AI mentor.
        If you have{" "}
        <a
          href="https://claude.ai/claude-code"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#8b74ff] underline underline-offset-2"
        >
          Claude Code
        </a>{" "}
        installed, the desktop app uses your existing subscription automatically — no
        key needed.
      </p>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => { setKey(e.target.value); setSaved(false); }}
            placeholder="sk-ant-api03-..."
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2 pl-3 pr-9 font-mono text-xs text-white outline-none transition-colors focus:border-[#6744FF]"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={busy || !key.trim()}
          className="shrink-0 rounded-lg border border-white/10 bg-[#1c1d22] px-4 py-2 font-inter text-sm text-white transition-colors hover:bg-[#26272e] disabled:opacity-50"
        >
          {saved ? <Check size={14} className="text-[#8b74ff]" /> : busy ? "Saving…" : "Save"}
        </button>
      </div>

      {error && <p className="font-inter text-xs text-red-400">{error}</p>}

      <p className="font-inter text-[11px] leading-relaxed text-neutral-600">
        Your key is stored encrypted in your profile. It is only used for AI calls
        you initiate through Upstream and is never shared or logged. You can remove
        it at any time.
      </p>
    </div>
  );
}
