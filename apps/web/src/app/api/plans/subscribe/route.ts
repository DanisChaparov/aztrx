import { NextResponse } from "next/server";

/**
 * GET /api/plans/subscribe — Placeholder for Stripe checkout.
 * When payment is live, this redirects to a Stripe Checkout Session.
 * For now it just tells the user billing isn't live yet.
 */
export async function GET() {
  return NextResponse.json(
    {
      message:
        "Billing isn't live yet — you already have Pro features. When payment launches, you'll be able to subscribe here. Your card won't be charged until you explicitly confirm.",
    },
    { status: 200 }
  );
}
