import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SessionCommitRow } from "../database.types";

export interface SessionCommit {
  sha: string;
  message: string;
  htmlUrl: string;
  additions: number | null;
  deletions: number | null;
  committedAt: string | null;
}

function toSessionCommit(row: SessionCommitRow): SessionCommit {
  return {
    sha: row.sha,
    message: row.message,
    htmlUrl: row.html_url,
    additions: row.additions,
    deletions: row.deletions,
    committedAt: row.committed_at,
  };
}

export async function getSessionCommits(
  client: SupabaseClient<Database>,
  sessionId: string
): Promise<SessionCommit[]> {
  const { data, error } = await client
    .from("session_commits")
    .select("*")
    .eq("session_id", sessionId)
    .order("committed_at", { ascending: false });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  return (data ?? []).map(toSessionCommit);
}

export interface RecentCommit {
  sha: string;
  message: string;
  htmlUrl: string;
  committedAt: string | null;
  projectName: string | null;
}

/** Most recent commits across all of the current user's sessions/projects, newest
 *  first — RLS scopes this to the authenticated user automatically. Used by the
 *  assistant's get_recent_commits tool so it can answer "what did I last commit". */
export async function getRecentCommits(
  client: SupabaseClient<Database>,
  limit = 5
): Promise<RecentCommit[]> {
  const { data: commits, error } = await client
    .from("session_commits")
    .select("*")
    .order("committed_at", { ascending: false })
    .limit(limit);
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }
  if (!commits || commits.length === 0) return [];

  const sessionIds = [...new Set(commits.map((c) => c.session_id))];
  const { data: sessions } = await client.from("focus_sessions").select("id, project_id").in("id", sessionIds);
  const projectIdBySession = new Map((sessions ?? []).map((s) => [s.id, s.project_id]));

  const projectIds = [...new Set([...projectIdBySession.values()].filter((id): id is string => !!id))];
  let projectNameById = new Map<string, string>();
  if (projectIds.length > 0) {
    const { data: projects } = await client.from("projects").select("id, name").in("id", projectIds);
    projectNameById = new Map((projects ?? []).map((p) => [p.id, p.name]));
  }

  return commits.map((row) => {
    const projectId = projectIdBySession.get(row.session_id);
    return {
      sha: row.sha,
      message: row.message,
      htmlUrl: row.html_url,
      committedAt: row.committed_at,
      projectName: projectId ? (projectNameById.get(projectId) ?? null) : null,
    };
  });
}

/** Batched lookup for the dashboard's recent-sessions list — one query instead of N. */
export async function getCommitsForSessions(
  client: SupabaseClient<Database>,
  sessionIds: string[]
): Promise<Map<string, SessionCommit[]>> {
  if (sessionIds.length === 0) return new Map();
  const { data, error } = await client
    .from("session_commits")
    .select("*")
    .in("session_id", sessionIds)
    .order("committed_at", { ascending: false });
  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") return new Map();
    throw error;
  }

  const bySession = new Map<string, SessionCommit[]>();
  for (const row of data ?? []) {
    const list = bySession.get(row.session_id) ?? [];
    list.push(toSessionCommit(row));
    bySession.set(row.session_id, list);
  }
  return bySession;
}
