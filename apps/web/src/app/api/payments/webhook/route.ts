import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

/**
 * POST /api/payments/webhook
 *
 * Polar.sh calls this when subscription events happen.
 * Uses @polar-sh/sdk for Standard Webhooks signature verification.
 *
 * Events handled:
 *   order.paid                   → payment received, activate Pro
 *   subscription.revoked          → subscription ended, downgrade to Free
 *
 * Setup: In Polar.sh dashboard → Settings → Webhooks, set:
 *   - URL: https://stt-opal.vercel.app/api/payments/webhook
 *   - Events: order.paid, subscription.revoked, subscription.canceled
 *   - Secret: copy to POLAR_WEBHOOK_SECRET on Vercel
 *
 * https://polar.sh/docs/integrate/webhooks
 */

/**
 * Service-role client — bypasses RLS and the prevent_self_plan_change() trigger
 * so the webhook can modify any user's plan.
 */
function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

/**
 * Extract user_id from a validated Polar.sh event payload.
 * We pass external_customer_id at checkout, which Polar.sh stores as
 * customer.external_id on the order.
 */
function extractUserId(event: any): string | null {
  // Primary: customer.external_id (set via external_customer_id at checkout)
  const externalId = event?.data?.customer?.external_id
    ?? event?.data?.customer?.externalId;
  if (externalId) return externalId;

  // Fallback: metadata.user_id from checkout
  const metaUserId = event?.data?.metadata?.user_id;
  if (metaUserId) return metaUserId;

  return null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const secret = process.env.POLAR_WEBHOOK_SECRET || "";

  // Verify signature using Polar.sh SDK
  let event: any;
  if (secret) {
    try {
      // Build headers record for validateEvent
      const headers: Record<string, string> = {};
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });

      event = validateEvent(body, headers, secret);
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        console.error("[polar-webhook] invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      console.error("[polar-webhook] verification error:", err);
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Production must never accept unsigned webhooks — otherwise anyone could
    // forge order.paid and self-upgrade to Pro via the service-role client below.
    console.error("[polar-webhook] POLAR_WEBHOOK_SECRET missing in production — rejecting");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  } else {
    // No secret configured — accept unsigned (local dev only).
    console.warn("[polar-webhook] no webhook secret set — accepting unsigned request (dev)");
    try {
      event = JSON.parse(body);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
  }

  const admin = serviceClient();
  const eventType = event?.type as string | undefined;
  const userId = extractUserId(event);

  console.log(
    "[polar-webhook]",
    eventType ?? "unknown",
    userId ? `user=${userId}` : "no user_id found"
  );

  if (!userId) {
    console.log(
      "[polar-webhook] full payload (no user_id):",
      JSON.stringify(event).slice(0, 1000)
    );
  }

  switch (eventType) {
    case "order.paid": {
      // Payment succeeded — activate Pro.
      // Fires on initial purchase AND each subscription renewal.
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
        console.log("[polar-webhook] activated Pro for", userId);
      }
      break;
    }

    case "subscription.revoked": {
      // Access definitively removed — downgrade to Free.
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
        console.log("[polar-webhook] downgraded to Free for", userId);
      }
      break;
    }

    case "subscription.canceled": {
      // User cancelled but keeps Pro until period end.
      // subscription.revoked handles the actual downgrade.
      console.log(
        "[polar-webhook] subscription canceled, keeping Pro until period end"
      );
      break;
    }

    default: {
      console.log(
        "[polar-webhook] unhandled event:",
        eventType ?? "(unknown)"
      );
    }
  }

  return NextResponse.json({ received: true });
}
