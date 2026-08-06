"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * Opens a Lemon Squeezy hosted checkout for subscribing to Upstream Pro.
 *
 * Lemon Squeezy is a Merchant of Record — handles tax/VAT/GST, fraud,
 * compliance, and works worldwide. The flow:
 *   1. Call /api/payments/checkout to create a checkout via Lemon Squeezy API
 *   2. Redirect the user to the checkout URL (hosted by Lemon Squeezy)
 *   3. After payment, the user lands back on /plans?subscribed=1
 *   4. The webhook at /api/payments/webhook activates the Pro plan
 *
 * Environment variables (set on Vercel):
 *   LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID,
 *   LEMONSQUEEZY_PRO_MONTHLY_VARIANT_ID, LEMONSQUEEZY_PRO_YEARLY_VARIANT_ID
 */
export function LemonSqueezyButton({
  variant = "monthly",
  label = "Subscribe to Pro",
  className = "",
}: {
  variant?: "monthly" | "yearly";
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant }),
      });
      const data = await res.json();

      if (!data.configured) {
        setError(
          data.message || "Payment not configured yet — check back soon."
        );
        setLoading(false);
        return;
      }

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // Redirect to Lemon Squeezy hosted checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("No checkout URL returned — try again.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Could not open checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        className={`flex items-center justify-center gap-2 rounded-xl py-3 font-manrope text-sm font-semibold transition-all bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 shadow-lg shadow-[#3B82F6]/20 disabled:opacity-50 ${className}`}
      >
        <Sparkles size={15} />
        {loading ? "Redirecting to checkout…" : label}
      </button>
      {error && (
        <p className="font-inter text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
