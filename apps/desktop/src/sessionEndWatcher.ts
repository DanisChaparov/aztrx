import { Notification } from "electron";
import { getActiveSession, type Database } from "@focus-forge/api-client";
import type { SupabaseClient } from "@supabase/supabase-js";

const POLL_INTERVAL_MS = 5000;

/**
 * Announces the end of a session from the desktop, not the web page.
 *
 * The countdown used to live entirely inside the session page: its chime and
 * alert only fired while that component was mounted, so navigating to the
 * dashboard — or closing the tab — meant the timer silently ran out and
 * nothing ever happened. Since the session's real end time is derivable from
 * rows already in the database, the always-running desktop app is the right
 * place to watch for it.
 *
 * It notifies rather than auto-completing: verification is the user's call,
 * and quietly finishing a session on their behalf would be worse than letting
 * it wait.
 */
export function startSessionEndWatcher(supabase: SupabaseClient<Database>): () => void {
  let stopped = false;
  // Session ids already announced, so a session sitting unverified past its end
  // time doesn't fire a notification every five seconds.
  const announced = new Set<string>();

  async function poll() {
    if (stopped) return;
    try {
      const session = await getActiveSession(supabase);
      if (!session || announced.has(session.id)) return;

      const endsAt = new Date(session.startedAt).getTime() + session.plannedDurationMin * 60_000;
      if (Date.now() < endsAt) return;

      announced.add(session.id);
      new Notification({
        title: "Time's up",
        body: `Your ${session.plannedDurationMin}-minute session finished. Open Upstream to verify it.`,
        // Explicit: this is the one moment the app has earned an audible alert.
        silent: false,
      }).show();
    } catch (err) {
      console.error("[sessionEndWatcher] poll failed:", err);
    }
  }

  const intervalId = setInterval(poll, POLL_INTERVAL_MS);
  poll().catch(() => {});

  return () => {
    stopped = true;
    clearInterval(intervalId);
  };
}
