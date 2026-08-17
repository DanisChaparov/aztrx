import { createClient } from "@supabase/supabase-js";
import type { Database } from "@aztrx/api-client";
import { chromeStorageAdapter } from "./chromeStorageAdapter";

declare const process: { env: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string } };

export function createExtensionSupabaseClient() {
  return createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
      storage: chromeStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}
