import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

export interface ToolUsageSummary {
  appName: string;
  totalSeconds: number;
}

/** Desktop widget calls this once, at session end, with the app's final accumulated totals. */
export async function recordSessionAppUsage(
  client: SupabaseClient<Database>,
  sessionId: string,
  usage: Record<string, number>
): Promise<void> {
  const rows = Object.entries(usage)
    .filter(([, seconds]) => seconds > 0)
    .map(([appName, seconds]) => ({ session_id: sessionId, app_name: appName, seconds_active: Math.round(seconds) }));
  if (rows.length === 0) return;

  const { error } = await client.from("session_app_usage").upsert(rows, { onConflict: "session_id,app_name" });
  if (error) throw error;
}

/** Per-session tool usage — what the user had open during a single focus session. */
export async function getSessionAppUsage(
  client: SupabaseClient<Database>,
  sessionId: string
): Promise<ToolUsageSummary[]> {
  const { data, error } = await client
    .from("session_app_usage")
    .select("app_name, seconds_active")
    .eq("session_id", sessionId)
    .order("seconds_active", { ascending: false });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  return (data ?? []).map((row) => ({
    appName: row.app_name,
    totalSeconds: row.seconds_active,
  }));
}

/** Aggregated across the user's sessions, for the dashboard's "tools used" breakdown. */
export async function getToolUsageSummary(client: SupabaseClient<Database>): Promise<ToolUsageSummary[]> {
  const { data, error } = await client.from("session_app_usage").select("app_name, seconds_active");
  if (error) {
    // 42P01 (Postgres undefined_table) or PGRST205 (PostgREST: table not in
    // schema cache) — the 0004 migration hasn't been applied yet. Degrade to
    // an empty breakdown instead of taking the whole dashboard down.
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }

  const totals = new Map<string, number>();
  for (const row of data ?? []) {
    totals.set(row.app_name, (totals.get(row.app_name) ?? 0) + row.seconds_active);
  }
  return Array.from(totals.entries())
    .map(([appName, totalSeconds]) => ({ appName, totalSeconds }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);
}
