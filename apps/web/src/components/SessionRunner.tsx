"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  abandonSession,
  listDistractions,
  listSessions,
  startSession,
  verifySession,
  type VerifySessionResult,
} from "@aztrx/api-client";
import type { FocusSession, Project } from "@aztrx/core";
import { CommitList, Confetti, Timer } from "@aztrx/ui";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { playSessionStart, playSessionComplete, playStreak } from "@/lib/sounds";
import { Select } from "@/components/Select";
import { WaterButton } from "@/components/WaterButton";
import { notifySessionEnd, playChime } from "@/lib/chime";
import { LiveActivityFeed } from "@/components/LiveActivityFeed";
import { SessionJournal } from "@/components/SessionJournal";

const DURATION_PRESETS = [
  { minutes: 25, label: "a pomodoro" },
  { minutes: 50, label: "a deep block" },
  { minutes: 90, label: "a full cycle" },
];

type SessionMode = "github" | "tool";

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
  const [mode, setMode] = useState<SessionMode>("github");
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
  const [journalSaved, setJournalSaved] = useState(false);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const timeUpAlertedRef = useRef(false);

  // Pause state
  const [paused, setPaused] = useState(false);
  const pausedAtRef = useRef<number | null>(null);
  const totalPausedMsRef = useRef(0);

  // Session history
  const [recentSessions, setRecentSessions] = useState<FocusSession[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    if (!session || paused) return;
    setNow(Date.now());
    timeUpAlertedRef.current = false;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session, paused]);

  const remainingSeconds = useMemo(() => {
    if (!session) return 0;
    const totalSeconds = session.plannedDurationMin * 60;
    if (now === null) return totalSeconds;
    const elapsedMs = (now - new Date(session.startedAt).getTime()) - totalPausedMsRef.current;
    return Math.max(0, Math.round(totalSeconds - elapsedMs / 1000));
  }, [session, now]);

  useEffect(() => {
    if (!session || remainingSeconds > 0 || timeUpAlertedRef.current) return;
    timeUpAlertedRef.current = true;
    playChime();
    notifySessionEnd("Time's up — Aztrx", "Your focus session finished. Click \"I'm done\" to verify it.");
    if (document.hidden) document.title = "⏰ Time's up — Aztrx";
  }, [session, remainingSeconds]);

  useEffect(() => {
    function resetTitleOnFocus() {
      if (!document.hidden) document.title = "Aztrx";
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
      playSessionStart();
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
      // Tool-tracked mode: skip GitHub verification, mark as verified based on
      // tool usage detected by the desktop app. Vibe coders and AI-first devs
      // don't need commits to prove they worked.
      const verifyResult = mode === "tool"
        ? await verifySession(supabase, session.id, true) // localActivityDetected=true → bypasses GitHub
        : await verifySession(supabase, session.id);
      setResult(verifyResult);
      setDistractions(await listDistractions(supabase, session.id).catch(() => []));
      setCompletedDurationMin(session.plannedDurationMin);
      setLastSessionId(session.id);
      setJournalSaved(false);
      setSession(null);
      router.refresh();
      if (verifyResult.verified) {
        playStreak();
      } else {
        playSessionComplete();
      }

      fetch("/api/push/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: verifyResult.verified ? "Session verified ✓" : "Session completed",
          body: verifyResult.verified
            ? "Nice work — your streak just grew."
            : "Session ended without verification. Check the dashboard for details.",
          url: "/dashboard",
        }),
      }).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete session");
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
      setPaused(false);
      totalPausedMsRef.current = 0;
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not end session");
    } finally {
      setBusy(false);
    }
  }

  function handlePause() {
    setPaused(true);
    pausedAtRef.current = Date.now();
  }

  function handleResume() {
    if (pausedAtRef.current) {
      totalPausedMsRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    setPaused(false);
  }

  // Load recent sessions for history panel (on mount, only when showing setup)
  useEffect(() => {
    if (session || result) return;
    if (historyLoaded) return;
    const supabase = getBrowserSupabaseClient();
    listSessions(supabase, { limit: 5 })
      .then((sessions) => {
        setRecentSessions(sessions);
        setHistoryLoaded(true);
      })
      .catch(() => {});
  }, [session, result, historyLoaded]);

  if (result) {
    return (
      <div className="glass-panel relative flex flex-col items-center gap-4 overflow-hidden p-8 text-center">
        {result.verified && <Confetti />}
        <div
          className={`font-instrument-serif text-3xl ${result.verified ? "text-[#93C5FD]" : "text-neutral-300"}`}
        >
          {result.verified ? "Verified ✓" : "Completed, unverified"}
        </div>
        {result.verified && (
          <div className="font-manrope text-sm font-medium text-[#60A5FA]">+{completedDurationMin} XP</div>
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
            result.githubActivityDetected !== null &&
            "No matching commits were found on the linked repo during this session. "}
          {result.githubActivityDetected === true && "Commits landed on the linked repo during this session. "}
          {result.githubActivityDetected === null &&
            "Tool-tracked session — verified by active editor usage, not commits. Works without GitHub. "}
          {result.impactEntries.length > 0 &&
            `Impact split across ${result.impactEntries.length} dependencies.`}
        </p>
        {result.commits.length > 0 && (
          <div className="w-full max-w-sm">
            <p className="mb-2 font-manrope text-xs text-neutral-500">Commits from this session</p>
            <CommitList commits={result.commits} />
          </div>
        )}

        {/* Session journal — notes + tags */}
        {lastSessionId && !journalSaved && (
          <div className="w-full max-w-sm">
            <SessionJournal
              sessionId={lastSessionId}
              onSave={() => setJournalSaved(true)}
            />
          </div>
        )}

        {journalSaved && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-inter text-xs text-neutral-500"
          >
            Note saved — find it in your session history.
          </motion.p>
        )}

        <WaterButton onClick={() => { setResult(null); setJournalSaved(false); setLastSessionId(null); }} variant="primary">
          Start another session
        </WaterButton>
      </div>
    );
  }

  if (session) {
    const activeProject = projects.find((p) => p.id === session.projectId);
    return (
      <div className="flex flex-col gap-4">
        <div className="glass-panel relative flex flex-col items-center gap-8 p-8">
          {/* Pause overlay */}
          {paused && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#0b0c10]/90 backdrop-blur-sm">
              <span className="font-instrument-serif text-4xl text-amber-400">PAUSED</span>
              <p className="font-inter text-sm text-neutral-400">Timer frozen — resume when you're back</p>
              <button
                onClick={handleResume}
                className="mt-2 rounded-xl bg-amber-400/15 border border-amber-400/30 px-5 py-2 font-manrope text-sm font-semibold text-amber-400 transition-colors hover:bg-amber-400/25"
              >
                ▶ Resume
              </button>
            </div>
          )}

          <Timer remainingSeconds={remainingSeconds} totalSeconds={session.plannedDurationMin * 60} />
          {error && <p className="font-inter text-xs text-red-400">{error}</p>}
          <div className="flex gap-3">
            {!paused && (
              <button
                onClick={handlePause}
                disabled={busy}
                className="rounded-[10px] border border-amber-400/25 bg-amber-400/10 px-5 py-2.5 font-cabin text-sm font-medium text-amber-400 transition-colors hover:bg-amber-400/20 disabled:cursor-wait disabled:opacity-50"
              >
                ⏸ Pause
              </button>
            )}
            <button
              onClick={handleComplete}
              disabled={busy}
              className="rounded-[10px] bg-[#3B82F6] px-5 py-2.5 font-cabin text-sm font-medium text-white transition-colors hover:bg-[#2563EB] disabled:cursor-wait disabled:opacity-50"
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
      {/* Session mode */}
      <div className="flex flex-col gap-1.5">
        <label className="font-manrope text-xs text-neutral-400">Verification mode</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("github")}
            className={`flex-1 rounded-xl border px-4 py-3 text-left transition-colors ${
              mode === "github" ? "border-[#3B82F6] bg-[#3B82F6]/10" : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <span className="font-manrope text-sm font-medium text-white">GitHub</span>
            <p className="mt-0.5 font-inter text-[11px] text-neutral-500">Verify with commits</p>
          </button>
          <button
            type="button"
            onClick={() => setMode("tool")}
            className={`flex-1 rounded-xl border px-4 py-3 text-left transition-colors ${
              mode === "tool" ? "border-[#3B82F6] bg-[#3B82F6]/10" : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <span className="font-manrope text-sm font-medium text-white">Tool-tracked</span>
            <p className="mt-0.5 font-inter text-[11px] text-neutral-500">No GitHub needed</p>
          </button>
        </div>
      </div>

      {/* Local folder verification notice */}
      {mode === "github" && (() => {
        const selectedProject = projects.find((p) => p.id === projectId);
        if (!selectedProject?.localPath) return null;
        return (
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-3">
            <p className="flex items-center gap-1.5 font-inter text-xs text-emerald-400/80">
              <span>Local verification enabled — un-pushed commits in <code className="text-emerald-300/80">{selectedProject.localPath}</code> will count toward verification.</span>
            </p>
          </div>
        );
      })()}

      <div className="flex flex-col gap-1.5">
        <label className="font-manrope text-xs text-neutral-400">Project</label>
        <Select
          value={projectId}
          onChange={setProjectId}
          placeholder="No project"
          options={[
            { value: "", label: "No project" },
            ...projects.map((project) => ({ value: project.id, label: project.name })),
          ]}
        />
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
                    ? "border-[#3B82F6] bg-[#3B82F6]/10"
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
                    isSelected ? "text-[#93C5FD]" : "text-neutral-500"
                  }`}
                >
                  {preset.label}
                </span>
              </motion.button>
            );
          })}
        </div>
        <label
          className={`flex cursor-text items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
            customDuration !== "" ? "border-[#3B82F6] bg-[#3B82F6]/[0.06]" : "border-white/10 bg-white/[0.02]"
          }`}
        >
          <span className="font-inter text-sm text-neutral-500">Something else</span>
          <input
            // `inputMode` rather than type="number": the numeric type renders
            // native spinner arrows that can't be themed and look broken here.
            type="text"
            inputMode="numeric"
            value={customDuration}
            onChange={(e) => {
              const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 3);
              setCustomDuration(digitsOnly);
              const parsed = parseInt(digitsOnly, 10);
              if (parsed > 0 && parsed <= 480) setDuration(parsed);
            }}
            placeholder="45"
            className="w-14 border-b border-white/15 bg-transparent pb-0.5 text-center font-manrope text-lg font-semibold text-white outline-none transition-colors placeholder:font-normal placeholder:text-neutral-600 focus:border-[#3B82F6]"
          />
          <span className="font-inter text-sm text-neutral-500">minutes</span>
        </label>
      </div>
      {error && <p className="font-inter text-xs text-red-400">{error}</p>}
      <WaterButton onClick={handleStart} disabled={busy} variant="primary" className="self-start">
        {busy ? "Starting…" : "Start focus session"}
      </WaterButton>

      {/* Session history */}
      {recentSessions.length > 0 && (
        <div className="mt-2 border-t border-white/[0.07] pt-5">
          <h3 className="font-manrope text-xs font-medium uppercase tracking-wider text-neutral-500 mb-3">
            Recent sessions
          </h3>
          <div className="flex flex-col gap-1.5">
            {recentSessions.map((s) => {
              const project = projects.find((p) => p.id === s.projectId);
              const date = new Date(s.startedAt);
              const durationMin = s.plannedDurationMin;
              const isToday = date.toDateString() === new Date().toDateString();
              const isYesterday = new Date(Date.now() - 86400000).toDateString() === date.toDateString();
              const dateLabel = isToday ? "Today" : isYesterday ? "Yesterday" : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`shrink-0 h-2 w-2 rounded-full ${
                      s.verified ? "bg-emerald-400" : s.status === "broken" ? "bg-red-400" : "bg-neutral-600"
                    }`} />
                    <span className="font-inter text-sm text-white truncate">
                      {project?.name ?? "No project"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-inter text-xs text-neutral-500">{dateLabel}</span>
                    <span className="font-mono text-xs text-neutral-400">{durationMin}min</span>
                    {s.verified && (
                      <span className="font-inter text-[10px] text-emerald-400/70">✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
