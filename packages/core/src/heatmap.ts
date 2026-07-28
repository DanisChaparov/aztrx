import type { FocusSession } from "./types";

export interface HeatmapDay {
  date: string; // YYYY-MM-DD, UTC
  verifiedCount: number;
  verifiedMinutes: number;
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

/** Last `weeks` * 7 days (inclusive of today), oldest first — feeds a GitHub-style contribution grid. */
export function buildHeatmap(sessions: FocusSession[], weeks = 12, now: Date = new Date()): HeatmapDay[] {
  const byDay = new Map<string, { verifiedCount: number; verifiedMinutes: number }>();
  for (const s of sessions) {
    if (!s.verified || !s.endedAt) continue;
    const key = toDateKey(s.endedAt);
    const existing = byDay.get(key) ?? { verifiedCount: 0, verifiedMinutes: 0 };
    existing.verifiedCount += 1;
    existing.verifiedMinutes += s.plannedDurationMin;
    byDay.set(key, existing);
  }

  const totalDays = weeks * 7;
  const days: HeatmapDay[] = [];
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  cursor.setUTCDate(cursor.getUTCDate() - (totalDays - 1));

  for (let i = 0; i < totalDays; i++) {
    const key = cursor.toISOString().slice(0, 10);
    const entry = byDay.get(key);
    days.push({ date: key, verifiedCount: entry?.verifiedCount ?? 0, verifiedMinutes: entry?.verifiedMinutes ?? 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return days;
}
