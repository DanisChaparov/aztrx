import { NextResponse } from "next/server";

/**
 * GET /api/plans/subscribe
 *
 * Not used directly — Paddle Checkout is client-side (Paddle.js overlay).
 * This endpoint exists as a convenience redirect for bookmark/legacy links.
 * The real checkout flow goes through POST /api/payments/checkout → Paddle.js.
 */
export async function GET() {
  return NextResponse.redirect(new URL("/plans", process.env.NEXT_PUBLIC_SITE_URL || "https://stt-opal.vercel.app"));
}
