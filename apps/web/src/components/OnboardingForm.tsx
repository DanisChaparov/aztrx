"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateProfile } from "@focus-forge/api-client";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

const DONE_KEY = "upstream-onboarding-done";
const NAME_KEY = "upstream-display-name";
const EMAIL_KEY = "upstream-email";
const EMAIL_VERIFIED_KEY = "upstream-email-verified";

export function OnboardingForm() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    // Allow re-triggering via ?onboard=1 — clears everything so you can test fresh.
    const forceShow = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("onboard");
    if (forceShow) {
      localStorage.removeItem(DONE_KEY);
      localStorage.removeItem(EMAIL_VERIFIED_KEY);
      localStorage.removeItem(EMAIL_KEY);
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

  const emailVerified = localStorage.getItem(EMAIL_VERIFIED_KEY) === "1";

  async function sendCode() {
    if (!email.includes("@")) { setMsg({ type: "error", text: "Enter a valid email." }); return; }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.sent || data.code) {
        setStep("verify");
        setMsg({ type: "info", text: data.sent ? `Code sent to ${email}. Check your inbox.` : `Dev mode — code: ${data.code}` });
      } else {
        setMsg({ type: "error", text: data.message || "Could not send." });
      }
    } catch {
      setMsg({ type: "error", text: "Network error. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    if (code.length !== 6) return;
    setBusy(true);
    try {
      const res = await fetch("/api/email/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });
      const data = await res.json();
      if (data.verified) {
        localStorage.setItem(EMAIL_KEY, email.trim());
        localStorage.setItem(EMAIL_VERIFIED_KEY, "1");
        // Auto-dismiss after verification — no need for the full form anymore.
        localStorage.setItem(NAME_KEY, name.trim() || email.split("@")[0]);
        localStorage.setItem(DONE_KEY, "1");
        setStep("form");
        setCode("");
        setMsg({ type: "success", text: "Email verified ✓" });
        setTimeout(() => router.refresh(), 800);
      } else {
        setMsg({ type: "error", text: data.error || "Wrong code." });
      }
    } catch {
      setMsg({ type: "error", text: "Network error." });
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setBusy(true);
    if (name.trim()) localStorage.setItem(NAME_KEY, name.trim());
    if (email.trim() && localStorage.getItem(EMAIL_VERIFIED_KEY) === "1") {
      localStorage.setItem(EMAIL_KEY, email.trim());
    }

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
    "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-inter text-sm text-white outline-none transition-colors focus:border-[#6744FF]";

  return (
    <div className="rounded-2xl border border-[#6744FF]/20 bg-[#0e0f14] p-6">
      <div className="mb-4">
        <h2 className="font-manrope text-lg font-medium text-white">Welcome to Upstream</h2>
        <p className="mt-1 font-inter text-sm text-[#A1A1AA]">
          Quick setup. We verify your email so we can send deadline reminders and session results.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="font-manrope text-xs text-neutral-400">Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="What should we call you?" className={inputClass} />
        </div>

        {/* Email with verification */}
        <div className="flex flex-col gap-1.5">
          <label className="font-manrope text-xs text-neutral-400">Email</label>
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (emailVerified) { localStorage.removeItem(EMAIL_VERIFIED_KEY); } }}
              placeholder="you@gmail.com"
              disabled={emailVerified}
              className={`${inputClass} flex-1 disabled:opacity-50`}
            />
            {emailVerified ? (
              <span className="flex shrink-0 items-center gap-1 rounded-xl border border-green-400/20 bg-green-400/[0.06] px-4 py-2.5 font-inter text-xs text-green-400">
                ✓ Verified
              </span>
            ) : (
              <button type="button" onClick={sendCode} disabled={busy || !email.includes("@")}
                className="shrink-0 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-manrope text-sm text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50">
                {busy ? "Sending…" : "Verify"}
              </button>
            )}
          </div>

          {/* Code input */}
          {step === "verify" && !emailVerified && (
            <div className="rounded-xl border border-[#6744FF]/20 bg-[#6744FF]/[0.04] p-4">
              <p className="mb-2 font-manrope text-xs text-white">Enter the code we sent to {email}</p>
              <div className="flex gap-2">
                <input value={code} onChange={(e) => setCode(e.target.value)}
                  placeholder="000000" maxLength={6}
                  className={`${inputClass} w-36 text-center text-lg tracking-[0.3em]`} />
                <button type="button" onClick={verifyCode} disabled={code.length !== 6 || busy}
                  className="rounded-xl bg-[#6744FF] px-4 py-2.5 font-manrope text-sm font-semibold text-white transition-colors hover:bg-[#6744FF]/90 disabled:opacity-50">
                  Confirm
                </button>
              </div>
            </div>
          )}
        </div>

        {msg && (
          <p className={`font-inter text-xs ${msg.type === "error" ? "text-red-400" : msg.type === "success" ? "text-green-400" : "text-[#8b74ff]"}`}>
            {msg.text}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={finish} disabled={busy}
            className="rounded-xl bg-[#6744FF] px-6 py-2.5 font-manrope text-sm font-semibold text-white transition-colors hover:bg-[#6744FF]/90 disabled:opacity-50">
            {busy ? "Saving…" : "Save & continue"}
          </button>
          <button onClick={skip}
            className="rounded-xl border border-white/10 px-6 py-2.5 font-manrope text-sm text-neutral-400 transition-colors hover:text-white">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
