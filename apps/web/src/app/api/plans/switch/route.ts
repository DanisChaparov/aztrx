import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/plans/switch?to=free|pro — Switch plans.
 * Pro switching is gated behind the service role (see migration 0010) —
 * only Stripe webhooks can set plan=pro. Free downgrades are always allowed.
 */
export async function GET(request: Request) {
  const supabase = await getServerSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const to = url.searchParams.get("to");

  if (to === "free") {
    const { error } = await supabase
      .from("profiles")
      .update({ plan: "free", plan_since: null, trial_ends_at: null, trial_used: true })
      .eq("id", user.user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.redirect(new URL("/plans?downgraded=1", process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"));
  }

  return NextResponse.json({ error: "Upgrades are handled by the billing system." }, { status: 400 });
}
