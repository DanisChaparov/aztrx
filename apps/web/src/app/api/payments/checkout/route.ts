import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/payments/checkout
 * Creates a Lemon Squeezy checkout for Upstream Pro.
 * Lemon Squeezy works worldwide — no country restrictions.
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const { variant = "monthly" } = (await request.json().catch(() => ({}))) as { variant?: string };

  // Lemon Squeezy variant IDs — set in env vars
  const variantId = variant === "yearly"
    ? process.env.LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID
    : process.env.LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID;

  if (!variantId) {
    return NextResponse.json({ error: "Payment not configured yet" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: user.email,
              custom: { user_id: user.id },
            },
            product_options: {
              redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://stt-opal.vercel.app"}/plans?trial=started`,
            },
          },
          relationships: {
            store: { data: { type: "stores", id: process.env.LEMONSQUEEZY_STORE_ID || "" } },
            variant: { data: { type: "variants", id: variantId } },
          },
        },
      }),
    });

    const json = await res.json();
    const checkoutUrl = json?.data?.attributes?.url;

    if (!checkoutUrl) {
      return NextResponse.json({ error: "Could not create checkout", detail: json }, { status: 500 });
    }

    return NextResponse.json({ url: checkoutUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
