import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const PRICE_IDS: Record<string, string> = {
  pro_monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "price_pro_monthly",
  pro_yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "price_pro_yearly",
};

export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in first" }, { status: 401 });

  const { plan = "pro_monthly" } = (await request.json().catch(() => ({}))) as { plan?: string };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [{ price: PRICE_IDS[plan] || PRICE_IDS.pro_monthly, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://stt-opal.vercel.app"}/plans?trial=started`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://stt-opal.vercel.app"}/plans`,
      metadata: { user_id: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
