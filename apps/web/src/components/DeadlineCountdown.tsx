"use client";

import { useEffect, useState } from "react";
import { Clock, AlertTriangle } from "lucide-react";

/**
 * Live countdown timer showing time remaining until a project deadline.
 * Updates every second for deadlines within 24 hours, every minute otherwise.
 */
export function DeadlineCountdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(Date.now());
  const deadlineMs = new Date(deadline).getTime();
  const remaining = deadlineMs - now;

  // Update frequency: every second if < 24h, every minute otherwise.
  useEffect(() => {
    const interval = remaining < 86_400_000 ? 1000 : 60_000;
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [remaining]);

  if (remaining <= 0) {
    const overdue = Math.abs(remaining);
    const days = Math.floor(overdue / 86_400_000);
    const hours = Math.floor((overdue % 86_400_000) / 3_600_000);
    return (
      <span className="flex items-center gap-1 font-mono text-xs text-red-400">
        <AlertTriangle size={11} />
        Overdue {days}d {hours}h
      </span>
    );
  }

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1000);

  const isUrgent = remaining < 3_600_000; // < 1 hour
  const isSoon = remaining < 86_400_000;   // < 24 hours

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
