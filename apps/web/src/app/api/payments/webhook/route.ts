import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * POST /api/payments/webhook
 *
 * Lemon Squeezy calls this when subscription events happen.
 * Webhooks are signed with HMAC-SHA256 using your webhook signing secret.
 *
 * Events handled:
 *   subscription_payment_success  → payment received, activate Pro
 *   subscription_cancelled        → user cancelled (keep Pro until expiry)
 *   subscription_expired          → subscription ended, downgrade to Free
 *   order_created                 → one-time purchase (not used for subs)
 *
 * Setup: In Lemon Squeezy dashboard → Settings → Webhooks, set:
 *   - URL: https://stt-opal.vercel.app/api/payments/webhook
 *   - Events: subscription_payment_success, subscription_cancelled,
 *             subscription_expired
 *   - Secret: copy to LEMONSQUEEZY_WEBHOOK_SECRET on Vercel
 *
 * https://docs.lemonsqueezy.com/api/webhooks
 */

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
  if (!secret) {
    console.warn("[lemonsqueezy-webhook] no webhook secret set — accepting unsigned request");
    return true;
  }
  try {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const digest = hmac.digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * We need the service role client to bypass both RLS and the
 * prevent_self_plan_change() trigger — those are deliberate guards
 * against normal (anon/authenticated) clients upgrading their own plan.
 */
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(request: Request) {
  const body = await request.text();

  // Verify webhook signature
  const signature = request.headers.get("x-signature");
  if (signature && !verifySignature(body, signature)) {
    console.error("[lemonsqueezy-webhook] invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = serviceClient();
  const eventName = event?.meta?.event_name as string | undefined;
  const customData = event?.meta?.custom_data as
    | { user_id?: string }
    | undefined;
  const userId = customData?.user_id;

  console.log(
    "[lemonsqueezy-webhook]",
    eventName ?? "unknown",
    userId ? `user=${userId}` : "no user_id"
  );

  // Pull subscription status from the event payload shape.
  // For subscription events: event.data.attributes is the subscription object.
  const subscriptionStatus =
    event?.data?.attributes?.status as string | undefined;

  switch (eventName) {
    case "subscription_payment_success": {
      // A payment succeeded — the subscription is active.
      if (userId) {
        await admin
          .from("profiles")
          .upsert(
            {
              id: userId,
              plan: "pro",
              plan_since: new Date().toISOString(),
            } as any,
            { onConflict: "id" }
          );
        console.log(
          "[lemonsqueezy-webhook] activated Pro for",
          userId
        );
      }
      break;
    }

    case "subscription_cancelled": {
      // Don't downgrade — user keeps Pro until the period ends.
      // subscription_expired fires when the period actually ends.
      console.log(
        "[lemonsqueezy-webhook] subscription cancelled, keeping Pro until period end"
      );
      break;
    }

    case "subscription_expired": {
      // The subscription period ended without renewal → downgrade.
      if (userId) {
        await admin
          .from("profiles")
          .upsert(
            {
              id: userId,
              plan: "free",
              plan_since: null,
            } as any,
            { onConflict: "id" }
          );
        console.log(
          "[lemonsqueezy-webhook] downgraded to Free for",
          userId
        );
      }
      break;
    }

    case "subscription_updated": {
      // subscription status can change (e.g. on_hold, past_due).
      // Only downgrade if the subscription is definitively not active.
      if (
        userId &&
        subscriptionStatus &&
        subscriptionStatus !== "active" &&
        subscriptionStatus !== "on_trial"
      ) {
        console.log(
          "[lemonsqueezy-webhook] subscription status =",
          subscriptionStatus,
          "— checking if downgrade needed"
        );
        // For past_due / unpaid / paused — leave Pro for now, they're
        // still within their paid period. Only expired (handled above)
        // or cancelled (already handled) should downgrade.
      }
      break;
    }

    case "order_created": {
      // One-time orders. Not relevant for subscription billing, but
      // logged for completeness.
      console.log("[lemonsqueezy-webhook] order created (non-subscription)");
      break;
    }

    default: {
      console.log(
        "[lemonsqueezy-webhook] unhandled event:",
        eventName ?? "(unknown)"
      );
    }
  }

  return NextResponse.json({ received: true });
}
