import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PushSubscriptionRow } from "../database.types";

export async function savePushSubscription(
  client: SupabaseClient<Database>,
  input: { userId: string; endpoint: string; p256dh: string; auth: string }
): Promise<void> {
  const { error } = await client.from("push_subscriptions").upsert(
    {
      user_id: input.userId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw error;
}

export async function listPushSubscriptionsForUser(
  client: SupabaseClient<Database>,
  userId: string
): Promise<PushSubscriptionRow[]> {
  const { data, error } = await client.from("push_subscriptions").select("*").eq("user_id", userId);
  if (error) throw error;
  return data ?? [];
}
