import { createBrowserSupabaseClient } from "@aztrx/api-client";

let client: ReturnType<typeof createBrowserSupabaseClient> | undefined;

/** Client Components: one shared browser client per tab. */
export function getBrowserSupabaseClient() {
  if (!client) client = createBrowserSupabaseClient();
  return client;
}
