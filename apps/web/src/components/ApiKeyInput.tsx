"use client";

import { useState, useEffect } from "react";
import { Key, Check, Eye, EyeOff, Trash2 } from "lucide-react";
import { saveKey, deleteKey, getSavedKey, type AiProvider } from "@/lib/ai-client";

interface ProviderInfo {
  id: AiProvider;
  name: string;
  placeholder: string;
  signUpUrl: string;
  color: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    placeholder: "sk-ant-api03-...",
    signUpUrl: "https://console.anthropic.com/",
    color: "#60A5FA",
  },
  {
    id: "openai",
    name: "OpenAI",
    placeholder: "sk-proj-...",
    signUpUrl: "https://platform.openai.com/api-keys",
    color: "#10A37F",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    placeholder: "AIza...",
    signUpUrl: "https://aistudio.google.com/apikey",
    color: "#8E7CC3",
  },
];

/**
 * Lets free-tier users provide their own AI API key for unlimited usage.
 *
 * 🔒 KEY NEVER LEAVES THE BROWSER. Stored in localStorage, sent directly
 * to the AI provider from the browser. Aztrx's servers never see it,
 * never log it, never store it. You can verify this in the Network tab
 * and in the source code (github.com/DanisChaparov/aztrx).
 */
export function ApiKeyInput() {
  const [provider, setProvider] = useState<AiProvider>("anthropic");
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasExisting, setHasExisting] = useState(false);

  // Load existing key from localStorage on mount
  useEffect(() => {
    const existing = getSavedKey(provider);
    if (existing) {
      setKey(existing);
      setHasExisting(true);
    } else {
      setKey("");
      setHasExisting(false);
    }
  }, [provider]);

  const p = PROVIDERS.find((p) => p.id === provider)!;

  function handleSave() {
    if (!key.trim()) return;
    setError(null);
    try {
      saveKey(provider, key.trim());
      setSaved(true);
      setHasExisting(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save key");
    }
  }

  function handleDelete() {
    deleteKey(provider);
    setKey("");
    setHasExisting(false);
    setSaved(false);
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-[#0e0f14] p-5">
      <div className="flex items-center gap-2">
        <Key size={15} className="text-neutral-500" />
        <h3 className="font-manrope text-sm font-medium text-neutral-400">Bring your own API key</h3>
        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-manrope text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
          Optional
        </span>
      </div>

      {/* Privacy-first notice */}
      <div className="rounded-xl border border-green-400/15 bg-green-400/[0.04] p-4">
        <p className="font-inter text-sm leading-relaxed text-white/90">
          <strong>You don't need to set this up.</strong> Aztrx includes{" "}
          <strong className="text-[#60A5FA]">5 free AI questions per day</strong> built in,
          and the desktop app uses your local Claude Code at no cost.
          Only add a key if you want unlimited questions from the web dashboard.
        </p>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-2 rounded-xl bg-white/[0.02] p-3">
        <span className="mt-0.5 text-[11px]">🔒</span>
        <p className="font-inter text-[11px] leading-relaxed text-neutral-400">
          <strong className="text-white">Your key never leaves this browser.</strong>{" "}
          Stored in localStorage, sent directly to {p.name} from your browser.
          Aztrx's servers never see it.{" "}
          <a
            href="https://github.com/DanisChaparov/aztrx/blob/master/apps/web/src/lib/ai-client.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 underline underline-offset-2 hover:text-neutral-400"
          >
            Verify in source →
          </a>
        </p>
      </div>

      {/* Provider selector */}
      <div className="flex gap-1.5">
        {PROVIDERS.map((prov) => (
          <button
            key={prov.id}
            type="button"
            onClick={() => setProvider(prov.id)}
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
          onClick={handleSave}
          disabled={!key.trim()}
          className="shrink-0 rounded-lg border border-white/10 bg-[#1c1d22] px-4 py-2 font-inter text-sm text-white transition-colors hover:bg-[#26272e] disabled:opacity-50"
        >
          {saved ? <Check size={14} className="text-[#60A5FA]" /> : "Save"}
        </button>
        {hasExisting && (
          <button
            type="button"
            onClick={handleDelete}
            className="shrink-0 rounded-lg border border-red-400/15 bg-red-400/[0.04] px-3 py-2 text-red-400 hover:bg-red-400/[0.08] transition-colors"
            title="Remove saved key"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {error && <p className="font-inter text-xs text-red-400">{error}</p>}

      <p className="font-inter text-[11px] leading-relaxed text-neutral-600">
        {hasExisting
          ? `✓ ${p.name} key saved in this browser.`
          : "Key is stored locally in your browser only."}{" "}
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
