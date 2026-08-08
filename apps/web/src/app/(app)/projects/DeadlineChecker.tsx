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
    const HOUR_MS = 60 * 60 * 1000;

    for (const project of projects) {
      if (!project.deadline || notified.has(project.id)) continue;

      const deadlineMs = new Date(project.deadline).getTime();
      const remaining = deadlineMs - now;

      // Notify if within 24 hours and not past due.
      if (remaining > 0 && remaining <= DAY_MS) {
        const hoursLeft = Math.ceil(remaining / HOUR_MS);
        notifyDeadline(project.id, project.name, project.deadline, hoursLeft)
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
  hoursLeft: number
): Promise<void> {
  // Email notification (primary).
  try {
    await fetch("/api/notify/deadline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, projectName: name, deadline, hoursLeft }),
    });
  } catch {
    // Best effort.
  }

  // Also try browser notification.
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
    try {
      new Notification("Deadline approaching", {
        body: `"${name}" is due in ${hoursLeft} ${hoursLeft === 1 ? "hour" : "hours"}. Check your email.`,
      });
    } catch { /* ignore */ }
  }
}
