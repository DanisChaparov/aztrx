import type { Plan } from "@focus-forge/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

/** True when an error is a missing-column (42703) or missing-table (42P01) —
 *  these happen when migrations haven't been applied yet and should never crash
 *  the app. The caller degrades to a sensible default instead. */
function isMissingMigration(err: { code?: string; message?: string }): boolean {
  return err.code === "42703" || err.code === "42P01" || err.code === "PGRST205";
}

/**
 * The signed-in user's effective plan. Pro users, active trial users, and
 * everyone when BILLING_LIVE=false all get "pro". Falls back to "free" when
 * the row or column is missing.
 */
export async function getPlan(client: SupabaseClient<Database>): Promise<Plan> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return "free";

  // Try with trial_ends_at first (migration 0014). If the column doesn't exist
  // yet, fall back to just the plan column.
  try {
    const { data, error } = await client
      .from("profiles")
      .select("plan, trial_ends_at")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    if (data?.plan === "pro") return "pro";
    if (data?.trial_ends_at && new Date(data.trial_ends_at) > new Date()) return "pro";
    return "free";
  } catch (err: any) {
    if (isMissingMigration(err)) {
      // Fall back to plan-only query.
      try {
        const { data } = await client.from("profiles").select("plan").eq("id", user.id).single();
        return data?.plan === "pro" ? "pro" : "free";
      } catch {
        return "free";
      }
    }
    return "free";
  }
}

/** Whether the signed-in user has opted their developer twin into being public. */
export async function getPublicProfileEnabled(client: SupabaseClient<Database>): Promise<boolean> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;

  try {
    const { data, error } = await client
      .from("profiles")
      .select("public_profile")
      .eq("id", user.id)
      .single();
    if (error) throw error;
    return data?.public_profile === true;
  } catch (err: any) {
    if (isMissingMigration(err)) return false;
    return false;
  }
}

export async function setPublicProfileEnabled(
  client: SupabaseClient<Database>,
  enabled: boolean
): Promise<void> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Not signed in");

  // Try update first.
  const { error: updateError, count } = await client
    .from("profiles")
    .update({ public_profile: enabled } as any)
    .eq("id", user.id);

  if (updateError) {
    if (updateError.code === "42703") {
      throw new Error("public_profile column missing — run migration 0011 on the Supabase instance");
    }
    throw updateError;
  }

  // If no row was updated, the profile row was never created.
  if (count === 0) {
    const { error: insertError } = await client
      .from("profiles")
      .insert({ id: user.id, public_profile: enabled } as any);
    if (insertError) {
      if (insertError.code === "42703") {
        throw new Error("public_profile column missing — run migration 0011 on the Supabase instance");
      }
      throw insertError;
    }
  }
}

/**
 * Resolves a username to a shareable profile, or null.
 * Uses the security-definer RPC function from migration 0011.
 */
export async function resolvePublicProfile(
  client: SupabaseClient<Database>,
  username: string
): Promise<{ githubUsername: string } | null> {
  try {
    const { data, error } = await client.rpc("get_public_profile", { lookup_username: username });
    if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return row?.github_username ? { githubUsername: row.github_username } : null;
  } catch {
    // RPC function doesn't exist (migration 0011 not applied).
    return null;
  }
}

/** Full profile for the signed-in user — name, contact, notification prefs. */
export async function getProfile(client: SupabaseClient<Database>): Promise<{
  displayName: string | null;
  phone: string | null;
  email: string | null;
  notifySessionComplete: boolean;
  notifyDeadline: boolean;
  notifyAchievement: boolean;
  notifyStreakRisk: boolean;
}> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) {
    return {
      displayName: null, phone: null, email: null,
      notifySessionComplete: true, notifyDeadline: true,
      notifyAchievement: true, notifyStreakRisk: true,
    };
  }

  try {
    const { data } = await client
      .from("profiles")
      .select("display_name, phone, notify_session_complete, notify_deadline, notify_achievement, notify_streak_risk")
      .eq("id", user.id)
      .single();

    return {
      displayName: data?.display_name ?? null,
      phone: data?.phone ?? null,
      email: user.email ?? null,
      notifySessionComplete: data?.notify_session_complete ?? true,
      notifyDeadline: data?.notify_deadline ?? true,
      notifyAchievement: data?.notify_achievement ?? true,
      notifyStreakRisk: data?.notify_streak_risk ?? true,
    };
  } catch {
    return {
      displayName: null, phone: null, email: user.email ?? null,
      notifySessionComplete: true, notifyDeadline: true,
      notifyAchievement: true, notifyStreakRisk: true,
    };
  }
}

/** Update profile fields — name, phone, notification prefs.
 *  Never throws when columns are missing (migration not applied) — just
 *  silently returns so the caller doesn't need to handle DB-level errors. */
export async function updateProfile(
  client: SupabaseClient<Database>,
  patch: {
    displayName?: string;
    phone?: string | null;
    notifySessionComplete?: boolean;
    notifyDeadline?: boolean;
    notifyAchievement?: boolean;
    notifyStreakRisk?: boolean;
  }
): Promise<void> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const update: Record<string, unknown> = {};
  if (patch.displayName !== undefined) update.display_name = patch.displayName;
  if (patch.phone !== undefined) update.phone = patch.phone;
  if (patch.notifySessionComplete !== undefined) update.notify_session_complete = patch.notifySessionComplete;
  if (patch.notifyDeadline !== undefined) update.notify_deadline = patch.notifyDeadline;
  if (patch.notifyAchievement !== undefined) update.notify_achievement = patch.notifyAchievement;
  if (patch.notifyStreakRisk !== undefined) update.notify_streak_risk = patch.notifyStreakRisk;

  if (Object.keys(update).length === 0) return;

  try {
    // Upsert so the profile row is created if it doesn't exist yet (email
    // sign-ups don't go through the OAuth callback, so their profile row is
    // created here on first write).
    const { error } = await client
      .from("profiles")
      .upsert({ id: user.id, ...update } as any, { onConflict: "id" });
    if (error) {
      // Missing column or table — migration not applied yet. Don't block the user.
      if (error.code === "42703" || error.code === "42P01" || error.code === "PGRST205") return;
      // Missing row — profile was never created. Also non-fatal.
      if (error.code === "PGRST116") return;
      throw error;
    }
  } catch (err: any) {
    // Some Supabase errors bypass the `error` return and throw directly
    // (e.g. network errors, .single() on empty result from a different path).
    // Treat any column/table-not-found as non-fatal.
    if (err?.code === "42703" || err?.code === "42P01") return;
    throw err;
  }
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
