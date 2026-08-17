import { DEFAULT_SITE_BLOCKLIST } from "@aztrx/core";

const STORAGE_KEY = "aztrx_blocklist";

/** The user's site blocklist, falling back to the list shared with the desktop
 *  monitor. Stored in chrome.storage.sync so it follows them between machines. */
export async function getBlocklist(): Promise<string[]> {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  return result[STORAGE_KEY] ?? DEFAULT_SITE_BLOCKLIST;
}

export async function setBlocklist(domains: string[]): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: domains });
}
