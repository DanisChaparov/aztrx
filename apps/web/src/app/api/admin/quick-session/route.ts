import { NextResponse } from "next/server";
import { getActiveSession, startSession, verifySession, abandonSession } from "@focus-forge/api-client";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";

/**
 * POST /api/admin/quick-session
 * ?complete=<id> — completes the session immediately
 *
 * Admin tool for testing the full session lifecycle in one click.
 * Creates a 5-minute session, then can complete it via query param.
 */
export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = await getServerSupabaseClient();

  const url = new URL(request.url);
  const completeId = url.searchParams.get("complete");

  if (completeId) {
    // Complete an existing session (tool-tracked mode for instant verification).
    try {
      const result = await verifySession(supabase, completeId, true);
      return NextResponse.json({ verified: result.verified, commits: result.commits.length, impact: result.impactEntries.length });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Start a new 5-minute session.
  try {
    const session = await startSession(supabase, {
      userId: user.id,
      projectId: null,
      plannedDurationMin: 5,
    });
    return NextResponse.json({ sessionId: session.id, startedAt: session.startedAt, mode: "tool-tracked" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
