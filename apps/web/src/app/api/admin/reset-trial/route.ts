import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminUser } from "@/lib/admin";

export async function POST() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "SERVICE_ROLE_KEY not set" }, { status: 500 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  // Reset trial for ALL users — useful for testing
  const { error } = await admin
    .from("profiles")
    .update({ trial_used: false, trial_ends_at: null } as any)
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true, message: "All trials reset. Refresh /plans." });
}
