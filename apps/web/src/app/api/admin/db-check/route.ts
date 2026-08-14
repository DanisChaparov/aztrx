import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/admin";

const CHECKS = [
  { table: "profiles", column: "public_profile", migration: "0011" },
  { table: "profiles", column: "plan", migration: "0010" },
  { table: "profiles", column: "plan_since", migration: "0010" },
  { table: "profiles", column: "trial_ends_at", migration: "0014" },
  { table: "profiles", column: "trial_used", migration: "0014" },
  { table: "profiles", column: "anthropic_api_key", migration: "0013" },
  { table: "profiles", column: "display_name", migration: "0016" },
  { table: "profiles", column: "phone", migration: "0016" },
  { table: "profiles", column: "notify_session_complete", migration: "0016" },
  { table: "profiles", column: "notify_deadline", migration: "0016" },
  { table: "profiles", column: "notify_achievement", migration: "0016" },
  { table: "profiles", column: "notify_streak_risk", migration: "0016" },
  { table: "projects", column: "archived", migration: "0015" },
  { table: "ambient_activity", column: null, migration: "0012" },
];

export async function POST() {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = await getServerSupabaseClient();

  const results: Array<{ migration: string; table: string; column: string | null; exists: boolean; error?: string }> = [];

  for (const check of CHECKS) {
    try {
      if (check.column) {
        // Check if column exists by selecting it.
        const { error } = await supabase
          .from(check.table)
          .select(check.column)
          .limit(1)
          .maybeSingle();
        results.push({
          migration: check.migration,
          table: check.table,
          column: check.column,
          exists: !error || error.code !== "42703",
          error: error?.code === "42703" ? undefined : error?.message?.slice(0, 80),
        });
      } else {
        // Check if table exists.
        const { error } = await supabase
          .from(check.table)
          .select("*", { count: "exact", head: true });
        results.push({
          migration: check.migration,
          table: check.table,
          column: null,
          exists: !error || (error.code !== "42P01" && error.code !== "PGRST205"),
          error: error?.code === "42P01" || error?.code === "PGRST205" ? undefined : error?.message?.slice(0, 80),
        });
      }
    } catch (err: any) {
      results.push({
        migration: check.migration,
        table: check.table,
        column: check.column,
        exists: false,
        error: err?.message?.slice(0, 80) || "Unknown error",
      });
    }
  }

  const missing = results.filter((r) => !r.exists);
  const present = results.filter((r) => r.exists);

  return NextResponse.json({
    summary: {
      total: results.length,
      present: present.length,
      missing: missing.length,
    },
    missing: missing.map((r) => `${r.migration}: ${r.table}${r.column ? `.${r.column}` : ""}`),
    applied: present.map((r) => r.migration).filter((v, i, a) => a.indexOf(v) === i).sort(),
    notApplied: missing.map((r) => r.migration).filter((v, i, a) => a.indexOf(v) === i).sort(),
    details: results,
  });
}
