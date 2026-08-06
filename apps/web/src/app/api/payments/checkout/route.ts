import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/payments/checkout
 *
 * Creates a Lemon Squeezy hosted checkout and returns the URL.
 * The frontend redirects the user to that URL — Lemon Squeezy handles
 * the entire payment flow (tax/VAT/GST, fraud, compliance) as the
 * Merchant of Record, same role Paddle filled before.
 *
 * Environment variables on Vercel:
 *   LEMONSQUEEZY_API_KEY            — your store API key
 *   LEMONSQUEEZY_STORE_ID           — numeric store id
 *   LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID  — variant id for $8/mo
 *   LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID   — variant id for $72/yr
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

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const monthlyVariantId = process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID;
  const yearlyVariantId = process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID;

  if (!apiKey || !storeId || !monthlyVariantId || !yearlyVariantId) {
    return NextResponse.json({
      configured: false,
      message:
        "Payment is not configured yet — set LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, and variant IDs on Vercel.",
    });
  }

  const variantId =
    variant === "yearly" ? yearlyVariantId : monthlyVariantId;

  try {
    const checkoutRes = await fetch(
      "https://api.lemonsqueezy.com/v1/checkouts",
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: {
                email: user.email ?? undefined,
                custom: {
                  user_id: user.id,
                },
              },
              product_options: {
                redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://stt-opal.vercel.app"}/plans?subscribed=1`,
              },
            },
            relationships: {
              store: {
                data: { type: "stores", id: storeId },
              },
              variant: {
                data: { type: "variants", id: variantId },
              },
            },
          },
        }),
      }
    );

    if (!checkoutRes.ok) {
      const err = await checkoutRes.text();
      console.error("[lemonsqueezy] checkout creation failed:", err);
      return NextResponse.json(
        { configured: true, error: "Could not create checkout — try again." },
        { status: 502 }
      );
    }

    const json = await checkoutRes.json();
    const checkoutUrl = json?.data?.attributes?.url as string | undefined;

    if (!checkoutUrl) {
      console.error(
        "[lemonsqueezy] no checkout url in response:",
        JSON.stringify(json).slice(0, 500)
      );
      return NextResponse.json(
        { configured: true, error: "Could not create checkout — unexpected response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ configured: true, url: checkoutUrl });
  } catch (err: any) {
    console.error("[lemonsqueezy] checkout exception:", err);
    return NextResponse.json(
      { configured: true, error: err.message || "Could not create checkout." },
      { status: 502 }
    );
  }
}
