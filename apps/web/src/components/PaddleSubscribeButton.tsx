"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

declare global {
  interface Window {
    Paddle?: {
      Environment: { set: (env: string) => void };
      Initialize: (opts: { token: string }) => void;
      Checkout: { open: (opts: any) => void };
    };
  }
}

/**
 * Opens a Paddle Checkout overlay for subscribing to Upstream Pro.
 *
 * Paddle is a Merchant of Record — handles tax/VAT/GST, fraud, compliance,
 * and works worldwide including Kazakhstan. The overlay is client-side only;
 * the server webhook at /api/payments/webhook activates the user's Pro plan
 * when the subscription is confirmed.
 */
export function PaddleSubscribeButton({
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
      // 1. Get Paddle config from our server
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant }),
      });
      const data = await res.json();

      if (!data.configured) {
        setError(data.message || "Payment not configured yet.");
        setLoading(false);
        return;
      }

      // 2. Load Paddle.js dynamically
      if (!window.Paddle) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Paddle.js"));
          document.head.appendChild(script);
        });
      }

      // 3. Initialize Paddle and open checkout
      window.Paddle!.Environment.set(data.environment);
      window.Paddle!.Initialize({ token: data.clientToken });
      window.Paddle!.Checkout.open({
        items: [{ priceId: data.priceId, quantity: 1 }],
        customer: { email: data.email },
      });
    } catch (err: any) {
      setError(err.message || "Could not open checkout.");
    } finally {
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
        {loading ? "Opening checkout…" : label}
      </button>
      {error && (
        <p className="font-inter text-xs text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
