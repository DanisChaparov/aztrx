"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User } from "lucide-react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export function EmailSignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and a password (min 8 characters).");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);

    const supabase = getBrowserSupabaseClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim() || undefined,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setBusy(false);
      return;
    }

    // If the session is immediately available (email confirmation is off in
    // Supabase), create the profile row and redirect to the dashboard.
    // If not, show a confirmation message and let the user navigate manually
    // after verifying their email.
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      // Create the profile row with the user's name. Email sign-ups don't go
      // through the OAuth callback, so this is where their profile row is born.
      const profileInsert: Record<string, unknown> = {
        id: sessionData.session.user.id,
        auth_provider: "email",
      };
      if (name.trim()) profileInsert.display_name = name.trim();

      await supabase.from("profiles").upsert(profileInsert as any, { onConflict: "id" });

      router.push("/dashboard");
      router.refresh();
    } else {
      setSuccess(true);
    }
    setBusy(false);
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-400/10">
          <Mail size={22} className="text-green-400" />
        </div>
        <p className="font-inter text-sm text-white">Account created!</p>
        <p className="font-inter text-xs text-neutral-400">
          Check your email for a confirmation link, then{" "}
          <a href="/login" className="text-[#8b74ff] underline">
            sign in
          </a>
          .
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-4 font-inter text-sm text-white outline-none transition-colors placeholder:text-neutral-500 focus:border-[#6744FF]";

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <div className="relative">
        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          autoComplete="name"
          className={inputClass}
        />
      </div>
      <div className="relative">
        <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>
      <div className="relative">
        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 8 characters)"
          autoComplete="new-password"
          required
          minLength={8}
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
        {busy ? "Creating account…" : "Sign up with email"}
      </button>
    </form>
  );
}
