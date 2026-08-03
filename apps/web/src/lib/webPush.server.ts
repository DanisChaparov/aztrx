import webpush from "web-push";
import type { PushSubscriptionRow } from "@focus-forge/api-client";

let vapidReady = false;

function ensureVapid(): boolean {
  if (vapidReady) return true;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:hello@example.com",
    publicKey,
    privateKey
  );
  vapidReady = true;
  return true;
}

export async function sendPushToSubscriptions(
  subscriptions: PushSubscriptionRow[],
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  if (!ensureVapid()) {
    console.warn("[push] VAPID keys not configured — skipping push notifications");
    return;
  }
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
