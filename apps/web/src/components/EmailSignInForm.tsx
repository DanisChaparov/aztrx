"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export function EmailSignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setBusy(true);
    setError(null);

    const supabase = getBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setBusy(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 font-inter text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-[#6744FF]";

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <div className="relative">
        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className={inputClass}
        />
      </div>
      <div className="relative">
        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          autoComplete="current-password"
          className={inputClass}
        />
      </div>

      {error && (
        <p className="font-inter text-xs text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-[#6744FF] px-4 py-2.5 font-manrope text-sm font-semibold text-white transition-colors hover:bg-[#5a39f0] disabled:opacity-50"
      >
        {busy ? "Signing in…" : "Sign in with email"}
      </button>
    </form>
  );
}
