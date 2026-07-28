"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GitCommitHorizontal, Radio } from "lucide-react";
import type { LiveActivityCommit } from "@/app/api/github-activity/route";

// GitHub caps authenticated requests at 5000/hour — 5s keeps this well under
// that even with several tabs/sessions open, unlike the Supabase-only pollers
// elsewhere (chatRunner/commandRunner), which poll at 1s since that's just
// the user's own database, not a rate-limited third-party API.
const POLL_INTERVAL_MS = 5000;

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function LiveActivityFeed({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [commits, setCommits] = useState<LiveActivityCommit[] | null>(null);
  const [, forceTick] = useState(0);
  const seenShasRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/github-activity?projectId=${projectId}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { commits: LiveActivityCommit[] };
        if (!cancelled) setCommits(data.commits);
      } catch {
        // Best-effort — a failed poll just tries again next tick.
      }
    }

    poll();
    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [projectId]);

  // Re-render every 30s so "Xs ago" labels stay fresh between polls.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const isNew = (sha: string) => {
    if (seenShasRef.current.has(sha)) return false;
    return true;
  };

  useEffect(() => {
    if (commits) commits.forEach((c) => seenShasRef.current.add(c.sha));
  }, [commits]);

  return (
    <div className="glass-panel flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Radio size={12} className="animate-pulse text-[#5ed29c]" />
        <span className="font-manrope text-xs font-medium text-neutral-300">
          Live activity — {projectName}
        </span>
      </div>

      {commits === null && <p className="font-inter text-xs text-neutral-500">Watching for activity…</p>}
      {commits !== null && commits.length === 0 && (
        <p className="font-inter text-xs text-neutral-500">
          No commits yet on this repo — they'll show up here the moment they land.
        </p>
      )}

      <ul className="flex flex-col gap-1.5">
        <AnimatePresence initial={false}>
          {(commits ?? []).slice(0, 8).map((commit) => (
            <motion.li
              key={commit.sha}
              initial={isNew(commit.sha) ? { opacity: 0, x: -8 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <a
                href={commit.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.06]"
              >
                <GitCommitHorizontal size={12} className="shrink-0 text-[#5ed29c]" />
                <span className="min-w-0 flex-1 truncate font-inter text-xs text-neutral-300">
                  {commit.message}
                </span>
                <span className="shrink-0 font-inter text-[11px] text-neutral-500">
                  {formatRelativeTime(commit.committedAt)}
                </span>
              </a>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
