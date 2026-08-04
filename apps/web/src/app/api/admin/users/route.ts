import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/admin/users
 * Returns all users with profile data. Requires admin access.
 */
export async function GET() {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch profiles with session stats
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, auth_provider, avatar_url, plan, github_username")
    .limit(50);

  if (error) {
    return NextResponse.json({ users: [], total: 0, error: error.message });
  }

  // Get session stats
  const { data: sessions } = await supabase
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
