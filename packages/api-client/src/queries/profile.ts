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

/** Whether the signed-in user has opted their developer twin into being public. */
export async function getPublicProfileEnabled(client: SupabaseClient<Database>): Promise<boolean> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return false;

  const { data } = await client.from("profiles").select("public_profile").eq("id", user.id).single();
  return data?.public_profile === true;
}

export async function setPublicProfileEnabled(
  client: SupabaseClient<Database>,
  enabled: boolean
): Promise<void> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await client.from("profiles").update({ public_profile: enabled }).eq("id", user.id);
  if (error) throw error;
}

/**
 * Resolves a username to a shareable profile, or null.
 *
 * Goes through a security-definer function rather than selecting from
 * `profiles`: that table holds GitHub access tokens, and granting anonymous
 * select on it to support this page would expose them.
 */
export async function resolvePublicProfile(
  client: SupabaseClient<Database>,
  username: string
): Promise<{ githubUsername: string } | null> {
  const { data, error } = await client.rpc("get_public_profile", { lookup_username: username });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row?.github_username ? { githubUsername: row.github_username } : null;
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
