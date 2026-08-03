"use client";

import { useState } from "react";
import {
  Zap, Mail, Bell, Database, CheckCircle, XCircle, RefreshCw,
  Play, User, Key, Timer, Eye, Trash2, Sparkles, Send
} from "lucide-react";

type TestResult = { ok: boolean; data: any; time: number } | null;

function Result({ result }: { result: TestResult }) {
  if (!result) return null;
  return (
    <div className={`mt-2 rounded-lg p-3 font-mono text-xs ${result.ok ? "bg-green-400/10 text-green-400" : "bg-red-400/10 text-red-400"}`}>
      <div className="flex items-center gap-2 mb-1">
        {result.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
        <span>{result.ok ? "OK" : "Failed"} ({result.time}ms)</span>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap max-h-40">{JSON.stringify(result.data, null, 2)}</pre>
    </div>
  );
}

/**
 * One-click test panel — tests every feature in the app.
 */
export function AdminPanel({ userId }: { userId: string }) {
  const [result, setResult] = useState<TestResult>(null);
  const [busy, setBusy] = useState(false);
  const [testEmail, setTestEmail] = useState("d.chaparov@gmail.com");
  const [testPhone, setTestPhone] = useState("+7383927472");

  async function run(label: string, fn: () => Promise<Response>) {
    setBusy(true); setResult(null);
    const t0 = Date.now();
    try {
      const res = await fn();
      const data = await res.json().catch(() => ({ status: res.status }));
      setResult({ ok: res.ok, data, time: Date.now() - t0 });
    } catch (err: any) {
      setResult({ ok: false, data: { error: err.message }, time: Date.now() - t0 });
    } finally { setBusy(false); }
  }

  const btn = "flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-manrope text-xs text-white transition-colors hover:bg-white/[0.08] disabled:opacity-50";
  const inp = "rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#6744FF]";

  const tests = [
    {
      icon: Mail, label: "Send email verification",
      desc: "Sends a 6-digit code to the email below",
      action: () => run("email-code", () => fetch("/api/email/send-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: testEmail }) })),
    },
    {
      icon: CheckCircle, label: "Verify email code",
      desc: "Verifies the code (paste from result above)",
      action: () => {
        const code = prompt("Enter the 6-digit code from the email:");
        if (!code) return;
        run("email-verify", () => fetch("/api/email/verify-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: testEmail, code }) }));
      },
    },
    {
      icon: Bell, label: "Send test email notification",
      desc: "Sends a test email via Gmail SMTP",
      action: () => run("email-notify", () => fetch("/api/admin/test-email", { method: "POST" })),
    },
    {
      icon: Bell, label: "Send push notification",
      desc: "Browser push notification (must be enabled)",
      action: () => run("push", () => fetch("/api/push/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "Test", body: "Push works!" }) })),
    },
    {
      icon: Timer, label: "Start + complete session",
      desc: "Creates a 5-min tool-tracked session, waits, completes it",
      action: async () => {
        setBusy(true); setResult(null);
        try {
          // Start session
          const s = await fetch("/api/admin/quick-session", { method: "POST" });
          const sData = await s.json();
          if (!s.ok) { setResult({ ok: false, data: sData, time: 0 }); setBusy(false); return; }
          // Complete it
          await new Promise(r => setTimeout(r, 500));
          const c = await fetch("/api/admin/quick-session?complete=" + sData.sessionId, { method: "POST" });
          const cData = await c.json();
          setResult({ ok: c.ok, data: { session: sData, result: cData }, time: Date.now() - Date.now() });
        } catch (err: any) {
          setResult({ ok: false, data: { error: err.message }, time: 0 });
        } finally { setBusy(false); }
      },
    },
    {
      icon: Eye, label: "Check DB migrations",
      desc: "Shows which columns/tables exist vs missing",
      action: () => run("db", () => fetch("/api/admin/db-check", { method: "POST" })),
    },
    {
      icon: User, label: "View profile data",
      desc: "Shows localStorage + DB profile",
      action: () => {
        const keys = ["upstream-display-name", "upstream-email", "upstream-email-verified", "upstream-phone", "upstream-onboarding-done", "upstream-onboarding-skipped", "upstream-public-profile"];
        const data: any = { localStorage: {} };
        for (const k of keys) data.localStorage[k] = localStorage.getItem(k);
        setResult({ ok: true, data, time: 0 });
      },
    },
    {
      icon: Sparkles, label: "Test Project Necromancer",
      desc: "Scans abandoned repo, generates revival steps",
      action: () => run("necromancer", () => fetch("/api/necromancer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectName: prompt("Project name to revive:") || "" }) })),
    },
    {
      icon: Trash2, label: "Reset onboarding",
      desc: "Clears onboarding state so form reappears",
      action: () => {
        ["upstream-onboarding-done", "upstream-onboarding-skipped", "upstream-email-verified", "upstream-display-name", "upstream-email"].forEach(k => localStorage.removeItem(k));
        setResult({ ok: true, data: { message: "Onboarding reset. Refresh the dashboard." }, time: 0 });
      },
    },
    {
      icon: Key, label: "Clear all localStorage",
      desc: "Wipes everything. Full fresh start.",
      action: () => {
        localStorage.clear();
        setResult({ ok: true, data: { message: "All localStorage cleared." }, time: 0 });
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Config inputs */}
      <div className="flex flex-wrap gap-4 rounded-2xl border border-white/10 bg-[#0e0f14] p-5">
        <div className="flex flex-col gap-1">
          <label className="font-manrope text-[10px] text-neutral-500">Test email</label>
          <input value={testEmail} onChange={e => setTestEmail(e.target.value)} className={inp} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="font-manrope text-[10px] text-neutral-500">Test phone</label>
          <input value={testPhone} onChange={e => setTestPhone(e.target.value)} className={inp} />
        </div>
      </div>

      {/* Test buttons */}
      <div className="grid gap-3 sm:grid-cols-2">
        {tests.map(({ icon: Icon, label, desc, action }) => (
          <button key={label} onClick={action} disabled={busy} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-[#0e0f14] p-4 text-left transition-colors hover:border-white/20 disabled:opacity-50">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">
              <Icon size={15} className="text-[#8b74ff]" />
            </div>
            <div>
              <p className="font-manrope text-sm font-medium text-white">{label}</p>
              <p className="font-inter text-xs text-neutral-500">{desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Result */}
      <Result result={result} />

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-[#0e0f14] p-4">
        <span className="font-manrope text-xs text-neutral-500 mr-2">Quick links:</span>
        {[
          ["/dashboard", "Dashboard"], ["/session", "Focus"], ["/projects", "Projects"],
          ["/profile", "Profile"], ["/settings", "Settings"], ["/plans", "Plans"],
          ["/share", "Share Card"], ["/report/monthly", "Report"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-lg border border-white/10 px-3 py-1 font-inter text-xs text-white hover:bg-white/5">
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}
