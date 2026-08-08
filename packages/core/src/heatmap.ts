import type { FocusSession } from "./types";
import { toLocalDayKey, getLocalTodayKey } from "./timezone";

export interface HeatmapDay {
  date: string; // YYYY-MM-DD in user's local timezone
  verifiedCount: number;
  verifiedMinutes: number;
}

/** Last `weeks` * 7 days (inclusive of today), oldest first — feeds a GitHub-style contribution grid. */
export function buildHeatmap(
  sessions: FocusSession[],
  weeks = 12,
  now: Date = new Date(),
  timezoneOffset: number = 0
): HeatmapDay[] {
  const byDay = new Map<string, { verifiedCount: number; verifiedMinutes: number }>();
  for (const s of sessions) {
    if (!s.verified || !s.endedAt) continue;
    const key = toLocalDayKey(s.endedAt, timezoneOffset);
    const existing = byDay.get(key) ?? { verifiedCount: 0, verifiedMinutes: 0 };
    existing.verifiedCount += 1;
    existing.verifiedMinutes += s.plannedDurationMin;
    byDay.set(key, existing);
  }

  const totalDays = weeks * 7;
  const days: HeatmapDay[] = [];

  // Build cursor at local "today" midnight, then go back (totalDays - 1) days.
  const localMs = now.getTime() + timezoneOffset * 60_000;
  const localNow = new Date(localMs);
  const cursor = new Date(
    Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate())
  );
  cursor.setUTCDate(cursor.getUTCDate() - (totalDays - 1));

  for (let i = 0; i < totalDays; i++) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cursor.getUTCDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    const entry = byDay.get(key);
    days.push({
      date: key,
      verifiedCount: entry?.verifiedCount ?? 0,
      verifiedMinutes: entry?.verifiedMinutes ?? 0,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}
