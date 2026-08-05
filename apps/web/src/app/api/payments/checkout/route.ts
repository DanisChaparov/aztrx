import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/payments/checkout
 *
 * Returns Paddle price IDs + client token so the frontend can open
 * a Paddle Checkout overlay. No server-side redirect — Paddle handles
 * the entire payment flow in an overlay (works worldwide, MoR included).
 *
 * Paddle environment is determined by PADDLE_ENVIRONMENT env var
 * ("sandbox" or "production", defaults to "sandbox").
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const { variant = "monthly" } = (await request.json().catch(() => ({}))) as { variant?: string };

  const monthlyPriceId = process.env.PADDLE_PRO_MONTHLY_PRICE_ID;
  const yearlyPriceId = process.env.PADDLE_PRO_YEARLY_PRICE_ID;
  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  const environment = process.env.PADDLE_ENVIRONMENT || "sandbox";

  const priceId = variant === "yearly" ? yearlyPriceId : monthlyPriceId;

  if (!clientToken || !priceId) {
    return NextResponse.json({
      configured: false,
      message: "Payment is not configured yet — check PADDLE_* env vars on Vercel.",
    });
  }

  return NextResponse.json({
    configured: true,
    clientToken,
    environment,
    priceId,
    email: user.email,
  });
}
