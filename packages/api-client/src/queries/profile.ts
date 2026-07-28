import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

/** Call right after sign-in, using the provider token Supabase hands back for the GitHub OAuth flow. */
export async function upsertGithubProfile(
  client: SupabaseClient<Database>,
  input: { userId: string; githubAccessToken: string; githubUsername: string | null }
): Promise<void> {
  const { error } = await client.from("profiles").upsert({
    id: input.userId,
    github_access_token: input.githubAccessToken,
    github_username: input.githubUsername,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
