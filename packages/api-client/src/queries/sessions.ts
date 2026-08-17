import type { SupabaseClient } from "@supabase/supabase-js";
import type { FocusSession } from "@aztrx/core";
import type { Database, FocusSessionRow } from "../database.types";

function toSession(row: FocusSessionRow): FocusSession {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    plannedDurationMin: row.planned_duration_min,
    status: row.status,
    verified: row.verified,
    notes: row.notes ?? null,
    tags: row.tags ?? null,
  };
}

export async function listSessions(
  client: SupabaseClient<Database>,
  opts: { projectId?: string; limit?: number } = {}
): Promise<FocusSession[]> {
  let query = client.from("focus_sessions").select("*").order("started_at", { ascending: false });
  if (opts.projectId) query = query.eq("project_id", opts.projectId);
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toSession);
}

export async function getActiveSession(client: SupabaseClient<Database>): Promise<FocusSession | null> {
  const { data, error } = await client
    .from("focus_sessions")
    .select("*")
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? toSession(data) : null;
}

export async function startSession(
  client: SupabaseClient<Database>,
  input: { userId: string; projectId: string | null; plannedDurationMin: number }
): Promise<FocusSession> {
  const { data, error } = await client
    .from("focus_sessions")
    .insert({
      user_id: input.userId,
      project_id: input.projectId,
      planned_duration_min: input.plannedDurationMin,
      status: "active",
    })
    .select("*")
    .single();
  if (error) throw error;
  return toSession(data);
}

/** User bailed early — marks the session broken without going through GitHub verification. */
export async function abandonSession(client: SupabaseClient<Database>, sessionId: string): Promise<void> {
  const { error } = await client
    .from("focus_sessions")
    .update({ status: "broken", ended_at: new Date().toISOString(), verified: false })
    .eq("id", sessionId);
  if (error) throw error;
}

/**
 * Ends a session the moment a real distraction is caught, rather than letting
 * it run out and reporting the bad news at the end.
 *
 * The desktop monitor only calls this after the same distraction has been on
 * screen across consecutive polls, so this is never a stray alt-tab — by the
 * time it fires, the video has been up for ten seconds or more.
 */
export async function breakSession(client: SupabaseClient<Database>, sessionId: string): Promise<void> {
  const { error } = await client
    .from("focus_sessions")
    .update({ status: "broken", ended_at: new Date().toISOString(), verified: false })
    .eq("id", sessionId)
    // Only an in-flight session can be broken — never reopen a finished one.
    .eq("status", "active");
  if (error) throw error;
}

/** Distractions recorded against a session, newest first. */
export async function listDistractions(
  client: SupabaseClient<Database>,
  sessionId: string
): Promise<{ domainOrApp: string; source: string; occurredAt: string }[]> {
  const { data, error } = await client
    .from("distraction_events")
    .select("domain_or_app, source, occurred_at")
    .eq("session_id", sessionId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    domainOrApp: row.domain_or_app,
    source: row.source,
    occurredAt: row.occurred_at,
  }));
}

export async function logDistraction(
  client: SupabaseClient<Database>,
  input: { sessionId: string; source: "extension" | "desktop"; domainOrApp: string }
): Promise<void> {
  const { error } = await client.from("distraction_events").insert({
    session_id: input.sessionId,
    source: input.source,
    domain_or_app: input.domainOrApp,
  });
  if (error) throw error;
}
