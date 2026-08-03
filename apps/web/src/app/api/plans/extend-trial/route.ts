import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const PLANS_URL = "/plans";

function redirect(message: string): NextResponse {
  return NextResponse.redirect(
    new URL(`${PLANS_URL}?error=${encodeURIComponent(message)}`, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
  );
}

export async function GET() {
  const supabase = await getServerSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return redirect("Please sign in first.");

  try {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const { error } = await supabase
      .from("profiles")
      .upsert(
        { id: user.user.id, trial_ends_at: trialEnd.toISOString(), trial_used: false } as any,
        { onConflict: "id" }
      );

    if (error) {
      if (error.code === "42703") return redirect("Trial system not available yet — database migration pending.");
      return redirect(error.message);
    }

    return NextResponse.redirect(
      new URL(`${PLANS_URL}?trial=extended`, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000")
    );
  } catch (err: any) {
    return redirect(err.message || "Something went wrong.");
  }
}
