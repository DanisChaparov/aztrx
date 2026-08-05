import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/admin/users
 * Returns ALL registered users with profile + session stats.
 * Uses service_role key to bypass RLS.
 */
export async function GET() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not set" }, { status: 500 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get all profiles
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, display_name, auth_provider, avatar_url, plan, github_username")
    .order("id", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ users: [], total: 0, error: error.message });
  }

  // Get session stats per user
  const { data: sessions } = await admin
    .from("focus_sessions")
    .select("user_id, verified");

  const userStats = new Map<string, { total: number; verified: number }>();
  for (const s of sessions ?? []) {
    const stats = userStats.get(s.user_id) || { total: 0, verified: 0 };
    stats.total++;
    if (s.verified) stats.verified++;
    userStats.set(s.user_id, stats);
  }

  const users = (profiles ?? []).map((p: any) => ({
    id: p.id,
    display_name: p.display_name,
    auth_provider: p.auth_provider,
    avatar_url: p.avatar_url,
    plan: p.plan,
    github_username: p.github_username,
    sessions: userStats.get(p.id)?.total ?? 0,
    verified: userStats.get(p.id)?.verified ?? 0,
  }));

  return NextResponse.json({ users, total: users.length });
}
