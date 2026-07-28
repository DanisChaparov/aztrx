"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  abandonSession,
  startSession,
  verifySession,
  type VerifySessionResult,
} from "@focus-forge/api-client";
import type { FocusSession, Project } from "@focus-forge/core";
import { CommitList, Confetti, Timer } from "@focus-forge/ui";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { WaterButton } from "@/components/WaterButton";
import { notifySessionEnd, playChime } from "@/lib/chime";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";

const DURATION_PRESETS = [25, 50, 90];

export function SessionRunner({
  projects,
  initialActiveSession,
}: {
  projects: Project[];
  initialActiveSession: FocusSession | null;
}) {
  const router = useRouter();
  const [session, setSession] = useState(initialActiveSession);
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? "");
  const [duration, setDuration] = useState<number>(DURATION_PRESETS[0]);
  const [customDuration, setCustomDuration] = useState("");
  // Starts `null` (not Date.now()) so the server-rendered HTML and the
  // client's first paint match exactly — computing "now" during render would
  // differ between the server's clock tick and the client's hydration tick,
  // throwing a hydration-mismatch error whenever a session is already active
  // on page load. The real countdown starts once this is set in useEffect.
  const [now, setNow] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifySessionResult | null>(null);
  const [completedDurationMin, setCompletedDurationMin] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const timeUpAlertedRef = useRef(false);

  useEffect(() => {
    if (!session) return;
    setNow(Date.now());
    timeUpAlertedRef.current = false;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session]);

  const remainingSeconds = useMemo(() => {
    if (!session) return 0;
    const totalSeconds = session.plannedDurationMin * 60;
    if (now === null) return totalSeconds;
    const elapsedMs = now - new Date(session.startedAt).getTime();
    return Math.max(0, Math.round(totalSeconds - elapsedMs / 1000));
  }, [session, now]);

  useEffect(() => {
    if (!session || remainingSeconds > 0 || timeUpAlertedRef.current) return;
    timeUpAlertedRef.current = true;
    playChime();
    notifySessionEnd("Time's up — Upstream", "Your focus session finished. Click \"I'm done\" to verify it.");
    if (document.hidden) document.title = "⏰ Time's up — Upstream";
  }, [session, remainingSeconds]);

  useEffect(() => {
    function resetTitleOnFocus() {
      if (!document.hidden) document.title = "Upstream";
    }
    document.addEventListener("visibilitychange", resetTitleOnFocus);
    return () => document.removeEventListener("visibilitychange", resetTitleOnFocus);
  }, []);

  async function handleStart() {
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const created = await startSession(supabase, {
        userId: user.id,
        projectId: projectId || null,
        plannedDurationMin: duration,
      });
      setSession(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start session");
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabaseClient();
      const verifyResult = await verifySession(supabase, session.id);
      setResult(verifyResult);
      setCompletedDurationMin(session.plannedDurationMin);
      setSession(null);
      router.refresh();

      // Best-effort — notification delivery shouldn't block the completion flow.
      fetch("/api/push/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: verifyResult.verified ? "Session verified ✓" : "Session completed",
          body: verifyResult.verified
            ? "Nice work — your streak just grew and your impact ledger updated."
            : "Session ended without verification. Check the dashboard for details.",
          url: "/dashboard",
        }),
      }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify session");
    } finally {
      setBusy(false);
    }
  }

  async function handleAbandon() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabaseClient();
      await abandonSession(supabase, session.id);
      setSession(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not end session");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="glass-panel relative flex flex-col items-center gap-4 overflow-hidden p-8 text-center">
        {result.verified && <Confetti />}
        <div
          className={`font-instrument-serif text-3xl ${result.verified ? "text-emerald-400" : "text-neutral-300"}`}
        >
          {result.verified ? "Verified ✓" : "Completed, unverified"}
        </div>
        {result.verified && (
          <div className="font-manrope text-sm font-medium text-[#5ed29c]">+{completedDurationMin} XP</div>
        )}
        <p className="max-w-sm font-inter text-sm text-neutral-400">
          {result.distractionEventCount > 0 &&
            `${result.distractionEventCount} distraction event(s) logged. `}
          {result.githubActivityDetected === false &&
            "No matching commits were found on the linked repo during this session. "}
          {result.githubActivityDetected === true && "Commits landed on the linked repo during this session. "}
          {result.impactEntries.length > 0 &&
            `Impact split across ${result.impactEntries.length} dependencies.`}
        </p>
        {result.commits.length > 0 && (
          <div className="w-full max-w-sm">
            <p className="mb-2 font-manrope text-xs text-neutral-500">Commits from this session</p>
            <CommitList commits={result.commits} />
          </div>
        )}
        <WaterButton onClick={() => setResult(null)} variant="primary">
          Start another session
        </WaterButton>
      </div>
    );
  }

  if (session) {
    const activeProject = projects.find((p) => p.id === session.projectId);
    return (
      <div className="flex flex-col gap-4">
        <div className="glass-panel flex flex-col items-center gap-8 p-8">
          <Timer remainingSeconds={remainingSeconds} totalSeconds={session.plannedDurationMin * 60} />
          {error && <p className="font-inter text-xs text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={handleComplete}
              disabled={busy}
              className="rounded-[10px] bg-emerald-500 px-5 py-2.5 font-cabin text-sm font-medium text-black transition-colors hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-50"
            >
              {busy ? "Verifying…" : "I'm done"}
            </button>
            <button
              onClick={handleAbandon}
              disabled={busy}
              className="rounded-[10px] border border-white/10 px-5 py-2.5 font-cabin text-sm font-medium text-neutral-300 transition-colors hover:border-white/30 disabled:cursor-wait disabled:opacity-50"
            >
              {busy ? "Ending…" : "Give up"}
            </button>
          </div>
        </div>
        {activeProject?.githubRepoUrl && (
          <LiveActivityFeed projectId={activeProject.id} projectName={activeProject.name} />
        )}
      </div>
    );
  }

  return (
    <div className="glass-panel flex flex-col gap-5 p-8">
      <div className="flex flex-col gap-1.5">
        <label className="font-manrope text-xs text-neutral-400">Project</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="rounded-[10px] border border-white/10 bg-white/[0.03] px-3 py-2 font-inter text-sm text-white outline-none transition-colors focus:border-[#5ed29c]"
        >
          <option value="">No project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-manrope text-xs text-neutral-400">Duration</label>
        <div className="flex flex-wrap items-center gap-2">
          {DURATION_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setDuration(preset);
                setCustomDuration("");
              }}
              className={`rounded-full px-4 py-1.5 font-cabin text-sm transition-colors ${
                duration === preset && customDuration === ""
                  ? "bg-[#5ed29c] text-[#070b0a]"
                  : "border border-white/10 text-neutral-300 hover:border-white/30"
              }`}
            >
              {preset} min
            </button>
          ))}
          <div
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors ${
              customDuration !== "" ? "border-[#5ed29c]" : "border-white/10"
            }`}
          >
            <input
              type="number"
              min={1}
              max={480}
              value={customDuration}
              onChange={(e) => {
                const value = e.target.value;
                setCustomDuration(value);
                const parsed = parseInt(value, 10);
                if (parsed > 0) setDuration(parsed);
              }}
              placeholder="Custom"
              className="w-14 bg-transparent font-cabin text-sm text-white outline-none placeholder:text-neutral-500"
            />
            <span className="font-cabin text-sm text-neutral-400">min</span>
          </div>
        </div>
      </div>
      {error && <p className="font-inter text-xs text-red-400">{error}</p>}
      <WaterButton onClick={handleStart} disabled={busy} variant="primary" className="self-start">
        {busy ? "Starting…" : "Start focus session"}
      </WaterButton>
    </div>
  );
}
