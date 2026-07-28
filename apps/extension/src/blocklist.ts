const DEFAULT_BLOCKLIST = ["twitter.com", "x.com", "youtube.com", "reddit.com", "instagram.com", "tiktok.com"];

const STORAGE_KEY = "upstream_blocklist";

export async function getBlocklist(): Promise<string[]> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return result[STORAGE_KEY] ?? DEFAULT_BLOCKLIST;
}

export async function setBlocklist(domains: string[]): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: domains });
}

export function matchesBlocklist(hostname: string, blocklist: string[]): boolean {
  return blocklist.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}
