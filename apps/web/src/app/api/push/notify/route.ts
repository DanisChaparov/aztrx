import { NextResponse } from "next/server";
import { listPushSubscriptionsForUser } from "@focus-forge/api-client";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { sendPushToSubscriptions } from "@/lib/webPush.server";

/**
 * Self-notify only: sends to the calling user's own subscriptions. Scheduled
 * reminders (deadline/streak-at-risk, sent to users who aren't the caller)
 * are a v2 cron-triggered Edge Function, not this route.
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, url } = (await request.json()) as { title: string; body: string; url?: string };

  const subscriptions = await listPushSubscriptionsForUser(supabase, user.id);
  await sendPushToSubscriptions(subscriptions, { title, body, url });

  return NextResponse.json({ ok: true, sent: subscriptions.length });
}
