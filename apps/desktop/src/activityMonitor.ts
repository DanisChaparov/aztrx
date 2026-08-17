import { Notification } from "electron";
import { breakSession, logDistraction, type Database } from "@aztrx/api-client";
import { matchDistraction, matchTrackedTool, type DistractionMatch } from "@aztrx/core";
import type { SupabaseClient } from "@supabase/supabase-js";
import { listOpenWindows } from "./openWindows";

const POLL_INTERVAL_MS = 5000;
// Require the same distraction open for two consecutive polls before logging
// anything — avoids penalizing a quick alt-tab glance.
const CONSECUTIVE_POLLS_BEFORE_FLAG = 2;
// Enumerating every window costs ~670ms of CPU (measured), so it runs on every
// other poll rather than every one. The focused-window check is cheap and stays
// at the full rate, so anything you're actually looking at is still caught fast.
const FULL_SCAN_EVERY_N_POLLS = 2;
/** Distinguishes "this poll didn't run a full scan" from "nothing was found". */
const SCAN_SKIPPED = Symbol("scan-skipped");

export class DesktopActivityMonitor {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private consecutiveBlockedPolls = 0;
  private loggedForCurrentEpisode = false;
  private appSeconds = new Map<string, number>();
  private pollCount = 0;

  constructor(private readonly supabase: SupabaseClient<Database>) {}

  start(sessionId: string): void {
    this.stop();
    this.consecutiveBlockedPolls = 0;
    this.loggedForCurrentEpisode = false;
    this.appSeconds = new Map();
    this.pollCount = 0;

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
    this.pollCount += 1;
    // Pure-ESM package — dynamic import() is the correct way to load it from
    // this CommonJS-bundled main process (see build.mjs comment).
    const { activeWindow } = await import("active-win");
    const focused = await activeWindow();
    const focusedApp = focused?.owner?.name;

    // Tool time is deliberately still focus-only: having an editor open in the
    // background isn't working in it.
    if (focusedApp) {
      const tracked = matchTrackedTool(focusedApp, undefined, focused?.title);
      if (tracked) {
        this.appSeconds.set(tracked.name, (this.appSeconds.get(tracked.name) ?? 0) + POLL_INTERVAL_MS / 1000);
      }
    }

    const distraction = await this.findDistraction(focusedApp, focused?.title);

    // "Didn't look" is not the same as "looked and found nothing" — treating a
    // skipped full scan as all-clear would reset the streak counter every other
    // poll and it would never reach the flag threshold.
    if (distraction === SCAN_SKIPPED) return;

    if (!distraction) {
      this.consecutiveBlockedPolls = 0;
      this.loggedForCurrentEpisode = false;
      return;
    }

    this.consecutiveBlockedPolls += 1;
    if (this.consecutiveBlockedPolls < CONSECUTIVE_POLLS_BEFORE_FLAG || this.loggedForCurrentEpisode) return;

    this.loggedForCurrentEpisode = true;
    await logDistraction(this.supabase, { sessionId, source: "desktop", domainOrApp: distraction.label });

    // End it here rather than letting the timer run out and delivering the bad
    // news at the end. A session you've already lost shouldn't keep counting
    // down as if it were still worth something.
    await breakSession(this.supabase, sessionId);
    this.stop();

    new Notification({
      title: "Session broken",
      body: `${distraction.label} was open — this session has ended and won't count.`,
    }).show();
    this.onBroken?.(distraction.label);
  }

  /** Notified with the distraction's name so the UI can say what happened. */
  onBroken: ((label: string) => void) | null = null;

  /**
   * Looks at every visible window, not just the focused one.
   *
   * Watching a video in a second window while an editor holds focus was the
   * obvious way to beat a focus-only check, and beating the check is the one
   * thing a verification product cannot allow. Anything with a window open on
   * screen counts; anything minimized to the tray does not, so a launcher that
   * merely starts with Windows is ignored.
   *
   * The gap this still leaves: a background *tab* inside a focused window.
   * Windows only exposes the active tab's title, so no desktop app can see
   * those — that is what the browser extension is for.
   */
  private async findDistraction(
    focusedApp: string | undefined,
    focusedTitle: string | undefined
  ): Promise<DistractionMatch | null | typeof SCAN_SKIPPED> {
    if (focusedApp) {
      const focusedMatch = matchDistraction(focusedApp, focusedTitle);
      if (focusedMatch) return focusedMatch;
    }

    if (this.pollCount % FULL_SCAN_EVERY_N_POLLS !== 0) return SCAN_SKIPPED;

    for (const openWindow of await listOpenWindows()) {
      const match = matchDistraction(openWindow.processName, openWindow.title);
      if (match) return match;
    }

    return null;
  }
}
