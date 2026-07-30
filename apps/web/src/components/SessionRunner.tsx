"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  abandonSession,
  listDistractions,
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

const DURATION_PRESETS = [
  { minutes: 25, label: "a pomodoro" },
  { minutes: 50, label: "a deep block" },
  { minutes: 90, label: "a full cycle" },
];

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
  const [duration, setDuration] = useState<number>(DURATION_PRESETS[0].minutes);
  const [customDuration, setCustomDuration] = useState("");
  // Starts `null` (not Date.now()) so the server-rendered HTML and the
  // client's first paint match exactly — computing "now" during render would
  // differ between the server's clock tick and the client's hydration tick,
  // throwing a hydration-mismatch error whenever a session is already active
  // on page load. The real countdown starts once this is set in useEffect.
  const [now, setNow] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<VerifySessionResult | null>(null);
  const [distractions, setDistractions] = useState<{ domainOrApp: string; source: string }[]>([]);
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
      // "1 distraction event" tells you nothing you can act on. Name them.
      setDistractions(await listDistractions(supabase, session.id).catch(() => []));
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
          className={`font-instrument-serif text-3xl ${result.verified ? "text-[#a996ff]" : "text-neutral-300"}`}
        >
          {result.verified ? "Verified ✓" : "Completed, unverified"}
        </div>
        {result.verified && (
          <div className="font-manrope text-sm font-medium text-[#8b74ff]">+{completedDurationMin} XP</div>
        )}
        {distractions.length > 0 && (
          <div className="w-full max-w-sm rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-left">
            <p className="font-manrope text-xs font-medium text-amber-400">
              {distractions.length === 1 ? "What broke it" : "What broke it"}
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {distractions.map((distraction, i) => (
                <li key={`${distraction.domainOrApp}-${i}`} className="font-inter text-sm text-neutral-300">
                  {distraction.domainOrApp}
                  <span className="ml-1.5 text-xs text-neutral-500">
                    {distraction.source === "extension" ? "blocked in browser" : "open on your desktop"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="max-w-sm font-inter text-sm text-neutral-400">
          {result.githubActivityDetected === false &&
            result.localActivityDetected === true &&
            "No GitHub commits yet, but real local commits were detected during this session — verified from your local activity. "}
          {result.githubActivityDetected === false &&
            result.localActivityDetected !== true &&
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
              className="rounded-[10px] bg-[#6744FF] px-5 py-2.5 font-cabin text-sm font-medium text-white transition-colors hover:bg-[#5a39f0] disabled:cursor-wait disabled:opacity-50"
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
          className="rounded-[10px] border border-white/10 bg-white/[0.03] px-3 py-2 font-inter text-sm text-white outline-none transition-colors focus:border-[#6744FF]"
        >
          <option value="">No project</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-3">
        <label className="font-manrope text-xs text-neutral-400">How long?</label>
        <div className="grid grid-cols-3 gap-3">
          {DURATION_PRESETS.map((preset) => {
            const isSelected = duration === preset.minutes && customDuration === "";
            return (
              <motion.button
                key={preset.minutes}
                type="button"
                onClick={() => {
                  setDuration(preset.minutes);
                  setCustomDuration("");
                }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={`relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl border px-3 py-5 transition-colors ${
                  isSelected
                    ? "border-[#6744FF] bg-[#6744FF]/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/25"
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="duration-glow"
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(103,68,255,0.35),transparent_70%)]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span
                  className={`relative font-manrope text-3xl font-semibold ${
                    isSelected ? "text-white" : "text-neutral-300"
                  }`}
                >
                  {preset.minutes}
                </span>
                <span className="relative font-inter text-[11px] uppercase tracking-wider text-neutral-500">
                  min
                </span>
                <span
                  className={`relative font-inter text-[11px] ${
                    isSelected ? "text-[#a996ff]" : "text-neutral-500"
                  }`}
                >
                  {preset.label}
                </span>
              </motion.button>
            );
          })}
        </div>
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-colors ${
            customDuration !== "" ? "border-[#6744FF] bg-[#6744FF]/[0.06]" : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <span className="font-inter text-sm text-neutral-500">or</span>
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
            placeholder="your own"
            className="w-24 bg-transparent font-manrope text-sm text-white outline-none placeholder:font-inter placeholder:text-neutral-500"
          />
          <span className="font-inter text-sm text-neutral-500">minutes</span>
        </div>
      </div>
      {error && <p className="font-inter text-xs text-red-400">{error}</p>}
      <WaterButton onClick={handleStart} disabled={busy} variant="primary" className="self-start">
        {busy ? "Starting…" : "Start focus session"}
      </WaterButton>
    </div>
  );
}
