"use client";

import { useEffect, useState } from "react";
import { Zap, Mail, Bell, Database, CheckCircle, XCircle, Timer, User, Key, Trash2, Sparkles, Users, Eye, Play } from "lucide-react";

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

export function AdminPanel({ userId }: { userId: string }) {
  const [result, setResult] = useState<TestResult>(null);
  const [busy, setBusy] = useState(false);
  const [testEmail, setTestEmail] = useState("d.chaparov@gmail.com");
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {});
  }, []);

  async function run(fn: () => Promise<Response>) {
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
  const inp = "rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-xs text-white outline-none focus:border-[#3B82F6]";

  return (
    <div className="flex flex-col gap-6">
      {/* Users section */}
      <div className="rounded-2xl border border-white/10 bg-[#0e0f14] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-[#60A5FA]" />
          <h2 className="font-manrope text-sm font-semibold text-white">Users</h2>
          <span className="text-xs text-neutral-500">({users.length} registered)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/5 text-neutral-500">
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Provider</th>
                <th className="pb-2 font-medium">Plan</th>
                <th className="pb-2 font-medium">Sessions</th>
                <th className="pb-2 font-medium">Verified</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} className="border-b border-white/[0.03]">
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-5 h-5 rounded-full" alt="" /> : <div className="w-5 h-5 rounded-full bg-white/10" />}
                      <div>
                        <div className="text-white">{u.display_name || u.github_username || "—"}</div>
                        <div className="text-neutral-500 text-[10px]">{u.id?.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 text-neutral-400">{u.auth_provider || "email"}</td>
                  <td className="py-2">{u.plan === "pro" ? <span className="text-[#60A5FA]">Pro</span> : <span className="text-neutral-500">Free</span>}</td>
                  <td className="py-2 text-white">{u.sessions}</td>
                  <td className="py-2 text-[#60A5FA]">{u.verified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Test tools */}
      <div className="rounded-2xl border border-white/10 bg-[#0e0f14] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-[#60A5FA]" />
          <h2 className="font-manrope text-sm font-semibold text-white">Test tools</h2>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex flex-col gap-1">
            <label className="font-manrope text-[10px] text-neutral-500">Test email</label>
            <input value={testEmail} onChange={e => setTestEmail(e.target.value)} className={inp} />
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { icon: Mail, label: "Send email code", action: () => run(() => fetch("/api/email/send-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: testEmail }) })) },
            { icon: CheckCircle, label: "Verify email", action: () => { const code = prompt("Enter code:"); if (code) run(() => fetch("/api/email/verify-code", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: testEmail, code }) })); } },
            { icon: Bell, label: "Test email notification", action: () => run(() => fetch("/api/admin/test-email", { method: "POST" })) },
            { icon: Timer, label: "Test deadline reminder", action: () => run(() => fetch("/api/notify/deadline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectName: "Test Project", deadline: new Date().toISOString(), hoursLeft: 24 }) })) },
            { icon: Timer, label: "Quick session", action: async () => { setBusy(true); const s = await fetch("/api/admin/quick-session", { method: "POST" }); const d = await s.json(); if (s.ok) { await new Promise(r => setTimeout(r, 500)); const c = await fetch("/api/admin/quick-session?complete=" + d.sessionId, { method: "POST" }); setResult({ ok: c.ok, data: { session: d, result: await c.json() }, time: 0 }); } else setResult({ ok: false, data: d, time: 0 }); setBusy(false); } },
            { icon: Database, label: "Check DB", action: () => run(() => fetch("/api/admin/db-check", { method: "POST" })) },
            { icon: Eye, label: "View profile", action: () => { const keys = ["upstream-display-name","upstream-email","upstream-onboarding-done"]; const data: any = { localStorage: {} }; for (const k of keys) data.localStorage[k] = localStorage.getItem(k); setResult({ ok: true, data, time: 0 }); } },
            { icon: Trash2, label: "Reset onboarding", action: () => { ["upstream-onboarding-done","upstream-email-verified","upstream-display-name"].forEach(k => localStorage.removeItem(k)); setResult({ ok: true, data: { message: "Reset. Refresh dashboard." }, time: 0 }); } },
            { icon: Key, label: "Clear localStorage", action: () => { localStorage.clear(); setResult({ ok: true, data: { message: "Cleared." }, time: 0 }); } },
            { icon: Sparkles, label: "Reset all trials", action: () => run(() => fetch("/api/admin/reset-trial", { method: "POST" })) },
          ].map(({ icon: Icon, label, action }) => (
            <button key={label} onClick={action} disabled={busy} className={btn}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      <Result result={result} />
    </div>
  );
}
