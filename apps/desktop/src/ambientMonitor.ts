// Ambient activity monitor — runs continuously from app launch to quit,
// independent of whether a focus session is active. Records which app is
// focused and its window title every 10 seconds, bucketed by hour.
//
// This is the data foundation for the AI mentor, the developer profile, and
// the "Wrapped" reports. Without it, all of those features are blind to work
// that happens outside of formal focus sessions.
//
// Session-tagged records are handled by activityMonitor.ts as before; this
// monitor handles the ambient (session_id = null) case and, when a session IS
// active, augments the session-tagged data with window-title detail.

import type { SupabaseClient } from "@supabase/supabase-js";
import { matchTrackedTool, isAiAssistedTool } from "@focus-forge/core";
import type { Database } from "@focus-forge/api-client";

const POLL_INTERVAL_MS = 10_000;
// Sync aggregated hourly buckets to Supabase every 5 minutes.
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

interface HourBucket {
  appName: string;
  windowTitle: string | null;
  trackedTool: string | null;
  isAiAssisted: boolean;
  secondsFocused: number;
  sessionId: string | null;
}

function bucketKey(now: Date, appName: string, sessionId: string | null): string {
  const hour = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()));
  return `${hour.toISOString()}|${appName}|${sessionId ?? "__ambient__"}`;
}

export class AmbientMonitor {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private syncId: ReturnType<typeof setInterval> | null = null;
  private buckets = new Map<string, HourBucket>();
  private currentSessionId: string | null = null;
  private stopped = false;

  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /** Call whenever the active session changes — session-less records are
   *  tagged with the current session so they can be correlated later. */
  setActiveSession(sessionId: string | null): void {
    this.currentSessionId = sessionId;
  }

  start(): void {
    this.stopped = false;
    this.buckets = new Map();

    this.intervalId = setInterval(() => {
      this.poll().catch((err) => console.error("[ambientMonitor] poll failed:", err));
    }, POLL_INTERVAL_MS);

    this.syncId = setInterval(() => {
      this.sync().catch((err) => console.error("[ambientMonitor] sync failed:", err));
    }, SYNC_INTERVAL_MS);
  }

  stop(): void {
    this.stopped = true;
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
    if (this.syncId) { clearInterval(this.syncId); this.syncId = null; }
    // Final flush on stop.
    this.sync().catch((err) => console.error("[ambientMonitor] final sync failed:", err));
  }

  private async poll(): Promise<void> {
    if (this.stopped) return;
    try {
      const { activeWindow } = await import("active-win");
      const window = await activeWindow();
      const appName = window?.owner?.name;
      if (!appName) return;

      const tracked = matchTrackedTool(appName, undefined, window?.title);
      const now = new Date();
      const key = bucketKey(now, appName, this.currentSessionId);

      const existing = this.buckets.get(key);
      if (existing) {
        existing.secondsFocused += POLL_INTERVAL_MS / 1000;
      } else {
        this.buckets.set(key, {
          appName,
          windowTitle: window?.title ?? null,
          trackedTool: tracked?.name ?? null,
          isAiAssisted: tracked?.aiAssisted ?? false,
          secondsFocused: POLL_INTERVAL_MS / 1000,
          sessionId: this.currentSessionId,
        });
      }
    } catch {
      // active-win can throw on some platforms; degrade gracefully.
    }
  }

  private async sync(): Promise<void> {
    if (this.buckets.size === 0) return;

    const rows = Array.from(this.buckets.values());
    this.buckets.clear();

    // Bucket to the current hour for the sync timestamp.
    const now = new Date();
    const bucketHour = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()));

    try {
      const {
        data: { user },
      } = await this.supabase.auth.getUser();
      if (!user) return; // not signed in, nothing to sync

      const payload = rows.map((row) => ({
        user_id: user.id,
        app_name: row.appName,
        window_title: row.windowTitle,
        tracked_tool: row.trackedTool,
        is_ai_assisted: row.isAiAssisted,
        bucket_hour: bucketHour.toISOString(),
        seconds_focused: Math.round(row.secondsFocused),
        session_id: row.sessionId,
      }));

      const { error } = await this.supabase
        .from("ambient_activity")
        .upsert(payload, { onConflict: "user_id,bucket_hour,app_name,session_id" });

      if (error) console.error("[ambientMonitor] sync upsert failed:", error);
    } catch (err) {
      console.error("[ambientMonitor] sync failed:", err);
      // Put rows back so they aren't lost on transient failures.
      for (const row of rows) {
        const key = bucketKey(new Date(), row.appName, row.sessionId);
        if (!this.buckets.has(key)) this.buckets.set(key, row);
      }
    }
  }
}
