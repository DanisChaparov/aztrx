import webpush from "web-push";
import type { PushSubscriptionRow } from "@focus-forge/api-client";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "mailto:hello@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionRow[],
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  await Promise.all(
    subscriptions.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
        // A dead/expired subscription shouldn't fail the whole batch.
        .catch((err) => console.error(`Push failed for ${sub.endpoint}:`, err))
    )
  );
}
