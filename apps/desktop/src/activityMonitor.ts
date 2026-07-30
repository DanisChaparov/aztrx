import { Notification } from "electron";
import { logDistraction, type Database } from "@focus-forge/api-client";
import { matchDistraction, matchTrackedTool } from "@focus-forge/core";
import type { SupabaseClient } from "@supabase/supabase-js";

const POLL_INTERVAL_MS = 5000;
// Require the same blocked app in focus for two consecutive polls before
// logging anything — avoids penalizing a quick alt-tab glance.
const CONSECUTIVE_POLLS_BEFORE_FLAG = 2;

export class DesktopActivityMonitor {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private consecutiveBlockedPolls = 0;
  private loggedForCurrentEpisode = false;
  private appSeconds = new Map<string, number>();

  constructor(private readonly supabase: SupabaseClient<Database>) {}

  start(sessionId: string): void {
    this.stop();
    this.consecutiveBlockedPolls = 0;
    this.loggedForCurrentEpisode = false;
    this.appSeconds = new Map();

    this.intervalId = setInterval(() => {
      this.poll(sessionId).catch((err) => console.error("Activity monitor poll failed:", err));
    }, POLL_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Snapshot of tracked-tool time (Cursor, Obsidian, etc.) accumulated since the last `start()`. */
  getAppUsageSnapshot(): Record<string, number> {
    return Object.fromEntries(this.appSeconds);
  }

  private async poll(sessionId: string): Promise<void> {
    // Pure-ESM package — dynamic import() is the correct way to load it from
    // this CommonJS-bundled main process (see build.mjs comment).
    const { activeWindow } = await import("active-win");
    const window = await activeWindow();
    const appName = window?.owner?.name;
    if (!appName) return;

    const tracked = matchTrackedTool(appName, undefined, window?.title);
    if (tracked) {
      this.appSeconds.set(tracked.name, (this.appSeconds.get(tracked.name) ?? 0) + POLL_INTERVAL_MS / 1000);
    }

    // Passing the window title lets a YouTube or Twitch tab count even when the
    // browser extension isn't installed — the process name alone is just
    // "chrome", which tells us nothing about what's on screen.
    const distraction = matchDistraction(appName, window?.title);

    if (!distraction) {
      this.consecutiveBlockedPolls = 0;
      this.loggedForCurrentEpisode = false;
      return;
    }

    this.consecutiveBlockedPolls += 1;
    if (this.consecutiveBlockedPolls < CONSECUTIVE_POLLS_BEFORE_FLAG || this.loggedForCurrentEpisode) return;

    this.loggedForCurrentEpisode = true;
    await logDistraction(this.supabase, { sessionId, source: "desktop", domainOrApp: distraction.label });
    new Notification({
      title: "Still in a focus session",
      body: `${distraction.label} is on your blocklist — this session won't verify.`,
    }).show();
  }
}
