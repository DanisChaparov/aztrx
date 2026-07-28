"use client";

import { useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { enablePushNotifications } from "@/lib/push";

export function EnableNotificationsButton() {
  const [status, setStatus] = useState<"idle" | "enabling" | "enabled" | "error">("idle");

  async function handleClick() {
    setStatus("enabling");
    try {
      await enablePushNotifications();
      setStatus("enabled");
    } catch {
      setStatus("error");
    }
  }

  if (status === "enabled") {
    return (
      <span className="flex items-center gap-1.5 font-inter text-xs text-neutral-500">
        <BellRing size={13} />
        Notifications enabled
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={status === "enabling"}
      className="flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2 font-manrope text-xs text-neutral-300 transition-colors hover:border-white/30 disabled:opacity-50"
    >
      <Bell size={13} />
      {status === "error" ? "Couldn't enable — retry" : status === "enabling" ? "Enabling…" : "Enable notifications"}
    </button>
  );
}
