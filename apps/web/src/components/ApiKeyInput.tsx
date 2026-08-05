"use client";

import { useState } from "react";
import { Key, Check, Eye, EyeOff } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type Provider = "anthropic" | "openai" | "gemini";

interface ProviderInfo {
  id: Provider;
  name: string;
  placeholder: string;
  signUpUrl: string;
  keyPrefix: string;
  color: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    placeholder: "sk-ant-api03-...",
    signUpUrl: "https://console.anthropic.com/",
    keyPrefix: "sk-ant-",
    color: "#60A5FA",
  },
  {
    id: "openai",
    name: "OpenAI",
    placeholder: "sk-proj-...",
    signUpUrl: "https://platform.openai.com/api-keys",
    keyPrefix: "sk-",
    color: "#10A37F",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    placeholder: "AIza...",
    signUpUrl: "https://aistudio.google.com/apikey",
    keyPrefix: "AIza",
    color: "#8E7CC3",
  },
];

const DB_COLUMNS: Record<Provider, string> = {
  anthropic: "anthropic_api_key",
  openai: "openai_api_key",
  gemini: "gemini_api_key",
};

/**
 * Lets free-tier users provide their own AI API key to unlock the full
 * AI mentor without upgrading to Pro. Supports Anthropic, OpenAI, and Gemini.
 *
 * No key is required if the user has Claude Code installed — the desktop app
 * already uses their local Claude Code subscription for AI features.
 */
export function ApiKeyInput() {
  const [provider, setProvider] = useState<Provider>("anthropic");
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const p = PROVIDERS.find((p) => p.id === provider)!;

  async function save() {
    if (!key.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabaseClient();
      const userId = (await supabase.auth.getUser()).data.user?.id ?? "";
      const column = DB_COLUMNS[provider];
      const { error: saveError } = await supabase
        .from("profiles")
        .update({ [column]: key.trim() } as any)
        .eq("id", userId);
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
        <Key size={15} className="text-[#60A5FA]" />
        <h3 className="font-manrope text-sm font-medium text-white">Bring your own API key</h3>
      </div>

      <p className="font-inter text-sm leading-relaxed text-[#A1A1AA]">
        Free users can bring their own AI key — Anthropic, OpenAI, or Gemini.
        If you have{" "}
        <a
          href="https://claude.ai/claude-code"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#60A5FA] underline underline-offset-2"
        >
          Claude Code
        </a>{" "}
        installed, the desktop app uses your existing subscription automatically — no key needed.
      </p>

      {/* Provider selector */}
      <div className="flex gap-1.5">
        {PROVIDERS.map((prov) => (
          <button
            key={prov.id}
            type="button"
            onClick={() => { setProvider(prov.id); setKey(""); setSaved(false); setError(null); }}
            className={`flex-1 rounded-lg py-1.5 font-inter text-xs font-medium transition-colors ${
              provider === prov.id
                ? "bg-white/10 text-white"
                : "bg-white/[0.03] text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {prov.name}
          </button>
        ))}
      </div>

      {/* Key input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => { setKey(e.target.value); setSaved(false); }}
            placeholder={p.placeholder}
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2 pl-3 pr-9 font-mono text-xs text-white outline-none transition-colors focus:border-[#3B82F6]"
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
          {saved ? <Check size={14} className="text-[#60A5FA]" /> : busy ? "Saving…" : "Save"}
        </button>
      </div>

      {error && <p className="font-inter text-xs text-red-400">{error}</p>}

      <p className="font-inter text-[11px] leading-relaxed text-neutral-600">
        Your key is stored in your profile and only used for AI calls you initiate.
        Never shared or logged. Remove it at any time.{" "}
        <a
          href={p.signUpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-500 underline underline-offset-2 hover:text-neutral-400"
        >
          Get a {p.name} key →
        </a>
      </p>
    </div>
  );
}
