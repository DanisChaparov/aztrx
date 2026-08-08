import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/payments/checkout
 *
 * Creates a Polar.sh hosted checkout and returns the URL.
 * Polar.sh is the Merchant of Record — handles tax/VAT/GST, fraud,
 * compliance, and works worldwide.
 *
 * Polar.sh uses separate products for monthly/yearly (no variants):
 *   https://polar.sh/upstreamai/products/{id}
 *
 * Environment variables (set on Vercel):
 *   POLAR_ACCESS_TOKEN                  — Organization Access Token
 *   POLAR_PRO_MONTHLY_PRODUCT_ID        — Product ID for $8/mo
 *   POLAR_PRO_YEARLY_PRODUCT_ID         — Product ID for $72/yr
 *
 * API docs: https://polar.sh/docs/api-reference
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const { variant = "monthly" } = (await request.json().catch(() => ({}))) as {
    variant?: string;
  };

  const accessToken = process.env.POLAR_ACCESS_TOKEN;
  const productId =
    variant === "yearly"
      ? process.env.POLAR_PRO_YEARLY_PRODUCT_ID
      : process.env.POLAR_PRO_MONTHLY_PRODUCT_ID;

  if (!accessToken || !productId) {
    return NextResponse.json({
      configured: false,
      message:
        "Payment is not configured yet — set POLAR_ACCESS_TOKEN, POLAR_PRO_MONTHLY_PRODUCT_ID, and POLAR_PRO_YEARLY_PRODUCT_ID on Vercel.",
    });
  }

  try {
    const checkoutRes = await fetch("https://api.polar.sh/v1/checkouts/", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        products: [productId],
        customer_email: user.email ?? undefined,
        external_customer_id: user.id,
        success_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://stt-opal.vercel.app"}/plans?subscribed=1`,
        metadata: {
          user_id: user.id,
        },
      }),
    });

    if (!checkoutRes.ok) {
      const err = await checkoutRes.text();
      console.error("[polar] checkout creation failed:", err);
      return NextResponse.json(
        { configured: true, error: "Could not create checkout — try again." },
        { status: 502 }
      );
    }

    const json = await checkoutRes.json();
    const checkoutUrl: string | undefined = json?.url;

    if (!checkoutUrl) {
      console.error(
        "[polar] no checkout url in response:",
        JSON.stringify(json).slice(0, 500)
      );
      return NextResponse.json(
        { configured: true, error: "Could not create checkout — unexpected response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ configured: true, url: checkoutUrl });
  } catch (err: any) {
    console.error("[polar] checkout exception:", err);
    return NextResponse.json(
      { configured: true, error: err.message || "Could not create checkout." },
      { status: 502 }
    );
  }
}
