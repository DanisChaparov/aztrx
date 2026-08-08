import type { FocusSession } from "./types";
import { toLocalDayKey, getLocalTodayKey } from "./timezone";

/**
 * Extract a local calendar day key from a Date that was already constructed
 * with local date components in its UTC fields.
 */
function cursorDayKey(c: Date): string {
  const y = c.getUTCFullYear();
  const m = String(c.getUTCMonth() + 1).padStart(2, "0");
  const d = String(c.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Current streak = consecutive calendar days (ending today or yesterday) that
 * have at least one verified session. A gap of more than one day breaks it.
 *
 * @param sessions - verified focus sessions with endedAt timestamps
 * @param now - current time (defaults to new Date())
 * @param timezoneOffset - user's timezone offset in minutes. Positive = east of UTC
 *   (e.g. IST = +330, EST = -300). Defaults to 0 (UTC).
 */
export function calculateStreak(
  sessions: FocusSession[],
  now: Date = new Date(),
  timezoneOffset: number = 0
): number {
  // Build the set of local-calendar days that have at least one verified session.
  const verifiedDays = new Set(
    sessions
      .filter((s) => s.verified && s.endedAt)
      .map((s) => toLocalDayKey(s.endedAt as string, timezoneOffset))
  );

  if (verifiedDays.size === 0) return 0;

  // Compute local "today" by applying offset, then build a UTC Date whose
  // UTC fields represent the local date — so cursorDayKey() reads them back.
  const localMs = now.getTime() + timezoneOffset * 60_000;
  const localNow = new Date(localMs);
  const cursor = new Date(
    Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate())
  );

  const todayKey = cursorDayKey(cursor);

  // Streak can start today or, if today has no session yet, yesterday.
  if (!verifiedDays.has(todayKey)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (verifiedDays.has(cursorDayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}
