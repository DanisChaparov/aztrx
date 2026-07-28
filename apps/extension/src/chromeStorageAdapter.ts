// Supabase's browser client defaults to localStorage, which isn't reliably
// available (or shared between the background service worker and the popup)
// in a Manifest V3 extension. chrome.storage.local is the correct substitute.
export const chromeStorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  },
  async removeItem(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  },
};
