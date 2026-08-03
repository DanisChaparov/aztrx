import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const PLANS_URL = "/plans";

function redirect(message: string): NextResponse {
  return NextResponse.redirect(
    new URL(`${PLANS_URL}?error=${encodeURIComponent(message)}`, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
  );
}

/**
 * GET /api/plans/trial — Start a 14-day Pro trial.
 * Always redirects back to /plans so the user never sees a raw JSON error page.
 */
export async function GET() {
  const supabase = await getServerSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return redirect("Please sign in first.");

  try {
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("trial_ends_at, trial_used")
      .eq("id", user.user.id)
      .single();

    if (profileErr && profileErr.code === "42703") {
      return redirect("Trial system not available yet — database migration pending.");
    }

    if (profile?.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) {
      return redirect("You already have an active trial.");
    }
    if (profile?.trial_used) {
      return redirect("You've already used your free trial.");
    }

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert({ id: user.user.id, trial_ends_at: trialEnd.toISOString() } as any, { onConflict: "id" });

    if (upsertErr) {
      if (upsertErr.code === "42703") {
        return redirect("Trial system not available yet — database migration pending.");
      }
      return redirect(upsertErr.message);
    }

    // Success — redirect with success flag.
    return NextResponse.redirect(
      new URL(`${PLANS_URL}?trial=started`, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
    );
  } catch (err: any) {
    return redirect(err.message || "Something went wrong.");
  }
}
