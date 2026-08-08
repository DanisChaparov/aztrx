import { NextResponse } from "next/server";

/**
 * GET /api/plans/subscribe
 *
 * Convenience redirect for bookmark/legacy links.
 * The real checkout flow goes through POST /api/payments/checkout →
 * Polar.sh hosted checkout page.
 */
export async function GET() {
  return NextResponse.redirect(new URL("/plans", process.env.NEXT_PUBLIC_SITE_URL || "https://stt-opal.vercel.app"));
}
