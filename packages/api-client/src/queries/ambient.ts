import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

export interface AmbientTimelinePoint {
  bucketHour: string;
  appName: string;
  trackedTool: string | null;
  isAiAssisted: boolean;
  secondsFocused: number;
  sessionId: string | null;
}

/** Returns ambient activity for the given time window, newest first. */
export async function getAmbientTimeline(
  client: SupabaseClient<Database>,
  opts: { since?: string; until?: string; limit?: number } = {}
): Promise<AmbientTimelinePoint[]> {
  let query = client
    .from("ambient_activity")
    .select("bucket_hour, app_name, tracked_tool, is_ai_assisted, seconds_focused, session_id")
    .order("bucket_hour", { ascending: false });

  if (opts.since) query = query.gte("bucket_hour", opts.since);
  if (opts.until) query = query.lte("bucket_hour", opts.until);
  if (opts.limit) query = query.limit(opts.limit);

  const { data, error } = await query;
  if (error) {
    // Gracefully handle missing table (migration not yet applied).
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  return (data ?? []).map((row) => ({
    bucketHour: row.bucket_hour,
    appName: row.app_name,
    trackedTool: row.tracked_tool,
    isAiAssisted: row.is_ai_assisted,
    secondsFocused: row.seconds_focused,
    sessionId: row.session_id,
  }));
}

export interface AmbientToolSummary {
  appName: string;
  trackedTool: string | null;
  isAiAssisted: boolean;
  totalSeconds: number;
}

/** Aggregated tool time from ambient data for a given time window. */
export async function getAmbientToolSummary(
  client: SupabaseClient<Database>,
  opts: { since?: string; until?: string } = {}
): Promise<AmbientToolSummary[]> {
  const timeline = await getAmbientTimeline(client, opts);
  const totals = new Map<string, { trackedTool: string | null; isAiAssisted: boolean; totalSeconds: number }>();
  for (const point of timeline) {
    const key = point.appName;
    const existing = totals.get(key);
    if (existing) {
      existing.totalSeconds += point.secondsFocused;
    } else {
      totals.set(key, {
        trackedTool: point.trackedTool,
        isAiAssisted: point.isAiAssisted,
        totalSeconds: point.secondsFocused,
      });
    }
  }
  return Array.from(totals.entries())
    .map(([appName, v]) => ({ appName, ...v }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
}

/** Total focused hours per day from ambient data, for the coding-hours trend. */
export async function getAmbientDailyHours(
  client: SupabaseClient<Database>,
  days = 30
): Promise<Array<{ date: string; totalHours: number }>> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const timeline = await getAmbientTimeline(client, { since: since.toISOString() });

  const byDay = new Map<string, number>();
  for (const point of timeline) {
    const date = point.bucketHour.slice(0, 10);
    byDay.set(date, (byDay.get(date) ?? 0) + point.secondsFocused);
  }
  return Array.from(byDay.entries())
    .map(([date, seconds]) => ({ date, totalHours: Math.round((seconds / 3600) * 10) / 10 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Convenience: today's ambient tool summary for the iPhone-style Screen Time card. */
export async function getDailyScreenTime(client: SupabaseClient<Database>): Promise<AmbientToolSummary[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return getAmbientToolSummary(client, { since: today.toISOString() });
}

export interface HourlyBucket {
  hour: number;        // 0-23, local hour
  appName: string;
  trackedTool: string | null;
  isAiAssisted: boolean;
  secondsFocused: number;
}

/**
 * Returns all ambient activity for a specific day, grouped by hour and app.
 * Each row = one app's usage during one hour. Multiple rows per hour if
 * multiple tools were used. Empty hours are not returned.
 */
export async function getHourlyScreenTime(
  client: SupabaseClient<Database>,
  date: Date
): Promise<{ dateLabel: string; hours: HourlyBucket[] }> {
  const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  // We store bucketed by UTC hour, but display in local hour.
  // The bucket_hour column is a timestamptz — Postgres does the conversion.
  const timeline = await getAmbientTimeline(client, {
    since: dayStart.toISOString(),
    until: dayEnd.toISOString(),
  });

  const hours: HourlyBucket[] = timeline.map((point) => {
    const bucketDate = new Date(point.bucketHour);
    return {
      hour: bucketDate.getHours(),
      appName: point.appName,
      trackedTool: point.trackedTool,
      isAiAssisted: point.isAiAssisted,
      secondsFocused: point.secondsFocused,
    };
  });

  return {
    dateLabel: dayStart.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
    hours,
  };
}
