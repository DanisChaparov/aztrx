import { NextResponse } from "next/server";
import { savePushSubscription } from "@focus-forge/api-client";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = (await request.json()) as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  await savePushSubscription(supabase, {
    userId: user.id,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });

  return NextResponse.json({ ok: true });
}
