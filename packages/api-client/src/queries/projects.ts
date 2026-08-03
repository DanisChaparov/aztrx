import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project } from "@focus-forge/core";
import type { Database, ProjectRow } from "../database.types";

function isMissingMigration(err: { code?: string }): boolean {
  return err.code === "42703" || err.code === "42P01" || err.code === "PGRST205";
}

function toProject(row: any): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    deadline: row.deadline,
    githubRepoUrl: row.github_repo_url,
    localPath: row.local_path,
    archived: row.archived ?? false,
    createdAt: row.created_at,
  };
}

export async function listProjects(
  client: SupabaseClient<Database>,
  opts?: { includeArchived?: boolean }
): Promise<Project[]> {
  try {
    let query = client.from("projects").select("*").order("created_at", { ascending: false });
    if (!opts?.includeArchived) query = query.eq("archived", false);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(toProject);
  } catch (err: any) {
    // If the `archived` column doesn't exist yet (migration 0015 not applied),
    // fall back to querying without the filter.
    if (isMissingMigration(err)) {
      const { data, error } = await client
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(toProject);
    }
    throw err;
  }
}

export async function createProject(
  client: SupabaseClient<Database>,
  input: { userId: string; name: string; deadline: string | null; githubRepoUrl: string | null; localPath?: string | null }
): Promise<Project> {
  const { data, error } = await client
    .from("projects")
    .insert({
      user_id: input.userId,
      name: input.name,
      deadline: input.deadline,
      github_repo_url: input.githubRepoUrl,
      local_path: input.localPath ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toProject(data);
}

export async function updateProject(
  client: SupabaseClient<Database>,
  projectId: string,
  patch: { name?: string; deadline?: string | null; githubRepoUrl?: string | null; localPath?: string | null }
): Promise<Project> {
  const update: Partial<ProjectRow> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.deadline !== undefined) update.deadline = patch.deadline;
  if (patch.githubRepoUrl !== undefined) update.github_repo_url = patch.githubRepoUrl;
  if (patch.localPath !== undefined) update.local_path = patch.localPath;

  const { data, error } = await client.from("projects").update(update as any).eq("id", projectId).select("*").single();
  if (error) throw error;
  return toProject(data);
}

export async function archiveProject(
  client: SupabaseClient<Database>,
  projectId: string
): Promise<void> {
  const { error } = await client
    .from("projects")
    .update({ archived: true } as any)
    .eq("id", projectId);
  if (error) {
    if (error.code === "42703") throw new Error("archived column missing — run migration 0015");
    throw error;
  }
}

export async function unarchiveProject(
  client: SupabaseClient<Database>,
  projectId: string
): Promise<void> {
  const { error } = await client
    .from("projects")
    .update({ archived: false } as any)
    .eq("id", projectId);
  if (error) {
    if (error.code === "42703") throw new Error("archived column missing — run migration 0015");
    throw error;
  }
}

export async function deleteProject(
  client: SupabaseClient<Database>,
  projectId: string
): Promise<void> {
  const { error } = await client.from("projects").delete().eq("id", projectId);
  if (error) throw error;
}
