import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * POST /api/payments/webhook
 * Lemon Squeezy calls this when a subscription is created/updated/cancelled.
 * Updates the user's plan in Supabase accordingly.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";

  // Verify signature
  const sig = request.headers.get("x-signature");
  if (secret && sig) {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(body);
    const digest = hmac.digest("hex");
    if (digest !== sig) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
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

  const eventName = event?.meta?.event_name;
  const userId = event?.meta?.custom_data?.user_id || event?.data?.attributes?.customer_attributes?.user_id;

  switch (eventName) {
    case "order_created":
    case "subscription_created":
      if (userId) {
        await admin.from("profiles").upsert({
          id: userId,
          plan: "pro",
          plan_since: new Date().toISOString(),
        } as any, { onConflict: "id" });
      }
      break;

    case "subscription_cancelled":
    case "subscription_expired":
      if (userId) {
        await admin.from("profiles").upsert({
          id: userId,
          plan: "free",
          plan_since: null,
        } as any, { onConflict: "id" });
      }
      break;
  }

  return NextResponse.json({ received: true });
}
