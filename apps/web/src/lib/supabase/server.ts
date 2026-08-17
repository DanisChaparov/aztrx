import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@aztrx/api-client";

/** Server Components / Route Handlers: reads the session from cookies. */
export async function getServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerSupabaseClient({
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Called from a Server Component render — middleware refreshes the
        // session cookie instead, so a failed write here is safe to ignore.
      }
    },
  });
}
