"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionCelebration } from "@/components/SubscriptionCelebration";

/**
 * Thin client wrapper that shows the subscription celebration
 * when the user returns from a successful Polar.sh checkout.
 *
 * Cleans the `?subscribed=1` param from the URL on dismiss so the
 * celebration doesn't re-trigger on refresh or back-navigation.
 */
export function SubscriptionSuccess({
  show,
}: {
  show: boolean;
}) {
  const router = useRouter();
  const [visible, setVisible] = useState(show);

  // Sync with prop changes (e.g. if parent re-renders)
  useEffect(() => {
    if (show) setVisible(true);
  }, [show]);

  if (!visible) return null;

  return (
    <SubscriptionCelebration
      onDismiss={() => {
        setVisible(false);
        // Clean the URL without a full page reload
        router.replace("/plans", { scroll: false });
      }}
    />
  );
}
