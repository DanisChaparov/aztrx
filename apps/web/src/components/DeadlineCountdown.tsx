"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

/**
 * Live countdown timer showing time remaining until a project deadline.
 * Updates every second for deadlines within 24 hours, every minute otherwise.
 */
export function DeadlineCountdown({ deadline }: { deadline: string }) {
  // Start with null during SSR to avoid hydration mismatch.
  // Date.now() differs between server (UTC) and client (local).
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const deadlineMs = new Date(deadline).getTime();

  // Update frequency: every second if < 24h, every minute otherwise.
  const remaining = now !== null ? deadlineMs - now : null;
  useEffect(() => {
    if (remaining === null) return;
    const interval = remaining < 86_400_000 ? 1000 : 60_000;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [remaining]);

  // During SSR or before first client tick, show a static placeholder.
  if (now === null) {
    return (
      <span className="flex items-center gap-1 font-mono text-xs text-neutral-400">
        <Clock size={11} />
        {new Date(deadline).toLocaleDateString()}
      </span>
    );
  }

  // Guard: we only reach here if now !== null, so remaining is a number.
  const r = remaining as number;

  if (r <= 0) {
    const overdue = Math.abs(r);
    const days = Math.floor(overdue / 86_400_000);
    const hours = Math.floor((overdue % 86_400_000) / 3_600_000);
    return (
      <span className="flex items-center gap-1 font-mono text-xs text-red-400">
        <AlertTriangle size={11} />
        Overdue {days}d {hours}h
      </span>
    );
  }

  const days = Math.floor(r / 86_400_000);
  const hours = Math.floor((r % 86_400_000) / 3_600_000);
  const minutes = Math.floor((r % 3_600_000) / 60_000);
  const seconds = Math.floor((r % 60_000) / 1000);

  const isUrgent = r < 3_600_000; // < 1 hour
  const isSoon = r < 86_400_000;   // < 24 hours

  return (
    <span
      className={`flex items-center gap-1 font-mono text-xs ${
        isUrgent ? "text-red-400 animate-pulse" : isSoon ? "text-amber-400" : "text-neutral-400"
      }`}
    >
      <Clock size={11} />
      {days > 0 && `${days}d `}
      {hours > 0 && `${hours}h `}
      {minutes > 0 && `${minutes}m `}
      {days === 0 && hours === 0 && `${seconds}s`}
      {days === 0 && hours === 0 && minutes === 0 ? "" : "left"}
    </span>
  );
}
