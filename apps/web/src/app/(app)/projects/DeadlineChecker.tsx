"use client";

import { useEffect, useState } from "react";
import type { Project } from "@focus-forge/core";

/**
 * Checks deadlines on mount. For projects due within 24h, sends an email
 * notification via /api/notify/deadline. Runs once per page load.
 */
export function DeadlineChecker({ projects }: { projects: Project[] }) {
  const [notified, setNotified] = useState<Set<string>>(new Set());

  useEffect(() => {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    for (const project of projects) {
      if (!project.deadline || notified.has(project.id)) continue;

      const deadlineMs = new Date(project.deadline).getTime();
      const remaining = deadlineMs - now;

      // Notify if within 24 hours and not past due.
      if (remaining > 0 && remaining <= DAY_MS) {
        notifyDeadline(project.id, project.name, project.deadline)
          .then(() => setNotified((prev) => new Set(prev).add(project.id)))
          .catch(() => {});
      }
    }
  }, [projects, notified]);

  return null;
}

async function notifyDeadline(
  projectId: string,
  name: string,
  deadline: string,
): Promise<void> {
  // Email notification (primary).
  try {
    await fetch("/api/notify/deadline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, projectName: name, deadline }),
    });
  } catch {
    // Best effort.
  }

  // Also try browser notification.
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    const remainingMs = new Date(deadline).getTime() - Date.now();
    const totalMinutes = Math.max(1, Math.round(remainingMs / (60 * 1000)));
    const label = totalMinutes < 60
      ? `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`
      : `${Math.round(totalMinutes / 60)} hour${Math.round(totalMinutes / 60) === 1 ? "" : "s"}`;
    try {
      new Notification("Deadline approaching", {
        body: `"${name}" is due in ${label}. Check your email.`,
      });
    } catch { /* ignore */ }
  }
}
