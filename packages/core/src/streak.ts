import type { FocusSession } from "./types";

function toDateKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD, UTC-based
}

/**
 * Current streak = consecutive calendar days (ending today or yesterday) that
 * have at least one verified session. A gap of more than one day breaks it.
 */
export function calculateStreak(sessions: FocusSession[], now: Date = new Date()): number {
  const verifiedDays = new Set(
    sessions
      .filter((s) => s.verified && s.endedAt)
      .map((s) => toDateKey(s.endedAt as string))
  );

  if (verifiedDays.size === 0) return 0;

  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const todayKey = cursor.toISOString().slice(0, 10);

  // Streak can start today or, if today has no session yet, yesterday.
  if (!verifiedDays.has(todayKey)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (verifiedDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}
