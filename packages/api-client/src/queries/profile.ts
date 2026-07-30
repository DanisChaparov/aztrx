import type { Plan } from "@focus-forge/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

/**
 * The signed-in user's plan. Falls back to "free" when the row or column is
 * missing, so a client running ahead of the migration degrades to the free tier
 * rather than throwing — and since nothing is gated yet, that changes nothing
 * for anyone today.
 */
export async function getPlan(client: SupabaseClient<Database>): Promise<Plan> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return "free";

  const { data } = await client.from("profiles").select("plan").eq("id", user.id).single();
  return data?.plan === "pro" ? "pro" : "free";
}

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
