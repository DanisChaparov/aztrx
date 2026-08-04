"use client";

import { useEffect, useRef } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

/**
 * Tracks time spent on the Upstream web app — no desktop app needed.
 * Logs to ambient_activity every 60 seconds while the tab is active.
 * Only tracks "Upstream Web" as the app — for full app tracking, use the desktop app.
 */
export function WebTimeTracker() {
  const lastSync = useRef(0);
  const secondsAccumulated = useRef(0);

  useEffect(() => {
    const SYNC_INTERVAL = 60_000; // sync every 60 seconds
    let interval: ReturnType<typeof setInterval>;

    async function sync() {
      const now = Date.now();
      const elapsed = Math.floor((now - lastSync.current) / 1000);
      if (elapsed < 10 || document.hidden) return; // skip if tab hidden or <10s

      const supabase = getBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      if (!user) return;

      const bucketHour = new Date();
      bucketHour.setMinutes(0, 0, 0);

      try {
        // Upsert ambient activity for this hour
        await supabase.from("ambient_activity").upsert({
          user_id: user.id,
          app_name: "Upstream Web",
          window_title: document.title,
          tracked_tool: "Upstream",
          is_ai_assisted: false,
          bucket_hour: bucketHour.toISOString(),
          seconds_focused: elapsed,
          session_id: null,
        } as any, { onConflict: "user_id,bucket_hour,app_name,session_id" }).select("id").maybeSingle();
      } catch {
        // Table might not exist yet — silent
      }

      lastSync.current = now;
    }

    lastSync.current = Date.now();
    interval = setInterval(sync, SYNC_INTERVAL);

    // Also sync on page unload
    window.addEventListener("beforeunload", sync);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", sync);
    };
  }, []);

  return null; // invisible component
}
