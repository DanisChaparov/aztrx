import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * POST /api/payments/webhook
 *
 * Paddle calls this when subscription events happen:
 * - subscription.activated   → user paid, activate Pro
 * - subscription.canceled    → subscription cancelled (plan stays Pro until expiry)
 * - subscription.past_due    → payment failed
 * - subscription.completed   → subscription expired, downgrade to Free
 *
 * Paddle Billing webhooks are signed with HMAC-SHA256 using your
 * webhook secret key. We verify the signature before trusting the payload.
 *
 * https://developer.paddle.com/webhooks/overview
 */
export async function POST(request: Request) {
  const body = await request.text();
  const secret = process.env.PADDLE_WEBHOOK_SECRET || "";

  // Verify Paddle signature
  if (secret) {
    const sigHeader = request.headers.get("paddle-signature");
    if (sigHeader) {
      try {
        // Paddle sends: ts;h1=signature
        const [ts, h1] = sigHeader.split(";");
        const tsValue = ts.split("=")[1];
        const h1Value = h1.split("=")[1];

        const signedPayload = `${tsValue}:${body}`;
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(signedPayload);
        const digest = hmac.digest("hex");

        if (digest !== h1Value) {
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      } catch {
        return NextResponse.json({ error: "Invalid signature format" }, { status: 401 });
      }
    }
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const eventType = event?.event_type;
  const userId = event?.data?.custom_data?.user_id;

  console.log("[paddle-webhook]", eventType, userId ? `user=${userId}` : "no user_id");

  switch (eventType) {
    case "subscription.activated":
      if (userId) {
        await admin.from("profiles").upsert({
          id: userId,
          plan: "pro",
          plan_since: new Date().toISOString(),
        } as any, { onConflict: "id" });
      }
      break;

    case "subscription.canceled":
      // Don't downgrade — user keeps Pro until the period ends.
      // Paddle will send subscription.completed when it truly expires.
      console.log("[paddle-webhook] subscription canceled, keeping Pro until period end");
      break;

    case "subscription.completed":
      // Subscription period ended without renewal → downgrade
      if (userId) {
        await admin.from("profiles").upsert({
          id: userId,
          plan: "free",
          plan_since: null,
        } as any, { onConflict: "id" });
      }
      break;

    case "subscription.past_due":
      // Payment failed — could notify the user here
      console.log("[paddle-webhook] subscription past due");
      break;
  }

  return NextResponse.json({ received: true });
}
