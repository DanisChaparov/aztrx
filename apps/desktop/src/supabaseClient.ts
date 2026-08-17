import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import type { Database } from "@aztrx/api-client";
import { fileStorageAdapter } from "./store";

declare const process: { env: { SUPABASE_URL: string; SUPABASE_ANON_KEY: string } };

export function createDesktopSupabaseClient() {
  return createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    auth: {
      storage: fileStorageAdapter(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    // Electron's main process runs Node without a global WebSocket (unlike
    // Node 22+ or a browser), so supabase-js's realtime client needs one
    // explicitly even though this app only polls and never opens a channel.
    realtime: {
      transport: WebSocket as unknown as typeof globalThis.WebSocket,
    },
  });
}
