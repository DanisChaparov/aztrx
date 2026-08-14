import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Admin authorization for the /admin page and /api/admin/* routes.
 *
 * A caller is an admin when their signed-in email is listed in ADMIN_EMAILS
 * (comma-separated, case-insensitive). The check is fail-closed: if the env
 * var is unset or empty, no one is an admin — including in dev.
 *
 * This module reads cookies via next/headers, so it is server-only. Do not
 * import it from a Client Component.
 */

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** The signed-in admin user, or null when the caller isn't an admin. */
export async function getAdminUser() {
  const supabase = await getServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email || !adminEmails().includes(email)) return null;
  return data.user;
}
