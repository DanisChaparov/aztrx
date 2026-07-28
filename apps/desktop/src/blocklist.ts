export const DEFAULT_APP_BLOCKLIST = ["Discord", "Steam", "EpicGamesLauncher", "Netflix", "Twitch", "TikTok"];

export function matchesAppBlocklist(appName: string, blocklist: string[]): boolean {
  const normalized = appName.toLowerCase();
  return blocklist.some((entry) => normalized.includes(entry.toLowerCase()));
}
