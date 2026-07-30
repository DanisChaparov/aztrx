/**
 * What counts as a distraction, shared by the browser extension and the
 * desktop monitor so the two surfaces can't drift apart.
 *
 * The extension can actually *block* a site (declarativeNetRequest); the
 * desktop app can only *observe* — it has no way to stop a native program
 * without admin rights, which would also break Microsoft Store packaging. So
 * desktop's job is to notice and log, which is enough: a logged distraction is
 * what makes a session fail verification.
 */

/** Native programs, matched against the OS process name. */
export const DEFAULT_APP_BLOCKLIST = [
  // Game launchers. The games themselves can't be enumerated — there are
  // hundreds of thousands of executables — but you have to go through one of
  // these to reach almost any of them, and the launcher stays open while you
  // play, so catching the launcher catches the session.
  "Steam",
  "EpicGamesLauncher",
  "Battle.net",
  "RiotClientUX",
  "LeagueClient",
  "GalaxyClient",
  "UbisoftConnect",
  "EADesktop",
  "RobloxPlayer",
  "Minecraft",
  // Chat and social
  "Discord",
  "Telegram",
  "WhatsApp",
  // Media. Deliberately no Spotify: music while coding is normal, and one bad
  // flag costs more trust than a missed one gains.
  "Netflix",
  "Twitch",
  "TikTok",
  "Instagram",
];

/** Sites, matched against the browser tab's hostname (extension) or the
 *  browser window's title (desktop). */
export const DEFAULT_SITE_BLOCKLIST = [
  "twitter.com",
  "x.com",
  "youtube.com",
  "reddit.com",
  "instagram.com",
  "tiktok.com",
  "twitch.tv",
  "netflix.com",
  "facebook.com",
];

/**
 * Browsers put the page title in the window title, so a focused browser is the
 * one case where the desktop app can see *which site* someone is on without the
 * extension installed. Outside a browser we never title-match — a developer with
 * `youtube-embed.ts` open in their editor is working, not procrastinating.
 */
const BROWSER_PROCESS_NAMES = [
  "chrome",
  "msedge",
  "firefox",
  "brave",
  "opera",
  "vivaldi",
  "arc",
  "safari",
  "zen",
];

export function isBrowser(appName: string): boolean {
  const normalized = appName.toLowerCase();
  return BROWSER_PROCESS_NAMES.some((browser) => normalized.includes(browser));
}

export function matchesAppBlocklist(appName: string, blocklist: string[]): boolean {
  const normalized = appName.toLowerCase();
  return blocklist.some((entry) => normalized.includes(entry.toLowerCase()));
}

/** Hostname match, used by the extension where the real URL is available. */
export function matchesSiteBlocklist(hostname: string, blocklist: string[]): boolean {
  const normalized = hostname.toLowerCase();
  return blocklist.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

export interface DistractionMatch {
  /** What to record — the site if we could identify one, otherwise the app. */
  label: string;
  kind: "app" | "site";
}

/**
 * Decides whether the currently focused window is a distraction.
 *
 * Titles are matched on the domain's *name* rather than the full hostname
 * ("youtube", not "youtube.com") because browsers render "Some Video - YouTube
 * - Google Chrome", never the URL.
 */
export function matchDistraction(
  appName: string,
  windowTitle: string | null | undefined,
  appBlocklist: string[] = DEFAULT_APP_BLOCKLIST,
  siteBlocklist: string[] = DEFAULT_SITE_BLOCKLIST
): DistractionMatch | null {
  if (matchesAppBlocklist(appName, appBlocklist)) {
    return { label: appName, kind: "app" };
  }

  if (!windowTitle || !isBrowser(appName)) return null;

  const normalizedTitle = windowTitle.toLowerCase();
  for (const domain of siteBlocklist) {
    const siteName = domain.split(".")[0];
    // Whole-word only. A plain substring check flags "Stack Overflow" as x.com,
    // because the site name for x.com is a single letter that appears inside
    // ordinary words like "fix".
    if (siteName && new RegExp(`\\b${escapeRegExp(siteName)}\\b`).test(normalizedTitle)) {
      return { label: domain, kind: "site" };
    }
  }

  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
