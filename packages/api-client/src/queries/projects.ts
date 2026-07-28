import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project } from "@focus-forge/core";
import type { Database, ProjectRow } from "../database.types";

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    deadline: row.deadline,
    githubRepoUrl: row.github_repo_url,
    localPath: row.local_path,
    createdAt: row.created_at,
  };
}

export async function listProjects(client: SupabaseClient<Database>): Promise<Project[]> {
  const { data, error } = await client.from("projects").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toProject);
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

  const { data, error } = await client.from("projects").update(update).eq("id", projectId).select("*").single();
  if (error) throw error;
  return toProject(data);
}
