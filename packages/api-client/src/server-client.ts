import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Framework-agnostic: callers (e.g. the Next.js app) pass a cookie adapter
 * (from next/headers `cookies()`) rather than this package importing Next.js.
 */
export function createServerSupabaseClient(cookieMethods: CookieMethodsServer) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods }
  );
}
