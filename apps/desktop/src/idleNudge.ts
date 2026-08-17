import { Notification } from "electron";
import { getActiveSession, type Database } from "@aztrx/api-client";
import { matchTrackedTool } from "@aztrx/core";
import type { SupabaseClient } from "@supabase/supabase-js";

const POLL_INTERVAL_MS = 30_000;
// How long of continuous tracked-tool use (with no focus session running)
// before we say anything — long enough that a quick check-in doesn't trigger it.
const NUDGE_THRESHOLD_MS = 20 * 60 * 1000;
// Don't nudge again for a while after one fires, even if the same streak
// continues — a reminder every 30s would be worse than no reminder at all.
const COOLDOWN_MS = 60 * 60 * 1000;

/**
 * Runs independently of whether a focus session is active — activityMonitor.ts
 * only tracks time *during* a session. This is the piece that notices real work
 * happening *outside* one and offers to start it, turning the tool-usage
 * tracking added tonight into something the user actually feels instead of
 * a number that only shows up on the dashboard later.
 */
export function startIdleNudge(supabase: SupabaseClient<Database>): () => void {
  let stopped = false;
  let streakStartedAt: number | null = null;
  let lastNudgeAt = 0;

  async function poll() {
    if (stopped) return;
    try {
      // Pure-ESM package — dynamic import() from this CJS-bundled main process.
      const { activeWindow } = await import("active-win");
      const window = await activeWindow();
      const appName = window?.owner?.name;
      const tracked = appName ? matchTrackedTool(appName, undefined, window?.title) : null;

      if (!tracked) {
        streakStartedAt = null;
        return;
      }
      if (streakStartedAt === null) streakStartedAt = Date.now();

      const elapsed = Date.now() - streakStartedAt;
      if (elapsed < NUDGE_THRESHOLD_MS || Date.now() - lastNudgeAt < COOLDOWN_MS) return;

      const active = await getActiveSession(supabase);
      if (active) return; // already properly tracked, nothing to suggest

      lastNudgeAt = Date.now();
      new Notification({
        title: "Still heads-down?",
        body: `You've been in ${tracked.name} for a while with no focus session running — open Aztrx to start one and back-fill the streak.`,
      }).show();
    } catch (err) {
      console.error("[idleNudge] poll failed:", err);
    }
  }

  const id = setInterval(poll, POLL_INTERVAL_MS);
  return () => {
    stopped = true;
    clearInterval(id);
  };
}
