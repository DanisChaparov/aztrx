import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../database.types";

export interface ImpactLedgerSummaryRow {
  dependencyId: string;
  dependencyName: string;
  totalSimulatedAmount: number;
}

/** Aggregated by dependency so the dashboard can show "$X to <dep>" rows. */
export async function getImpactLedgerSummary(
  client: SupabaseClient<Database>
): Promise<ImpactLedgerSummaryRow[]> {
  const { data, error } = await client
    .from("impact_ledger")
    .select("simulated_amount, dependency_snapshots(id, name)");
  if (error) {
    // Gracefully handle missing tables (migrations not applied yet).
    if (error.code === "42P01" || error.code === "PGRST205") return [];
    throw error;
  }

  const totals = new Map<string, ImpactLedgerSummaryRow>();
  for (const row of data ?? []) {
    const dep = row.dependency_snapshots as unknown as { id: string; name: string } | null;
    if (!dep) continue;
    const existing = totals.get(dep.id);
    if (existing) {
      existing.totalSimulatedAmount += row.simulated_amount;
    } else {
      totals.set(dep.id, {
        dependencyId: dep.id,
        dependencyName: dep.name,
        totalSimulatedAmount: row.simulated_amount,
      });
    }
  }
  return Array.from(totals.values()).sort((a, b) => b.totalSimulatedAmount - a.totalSimulatedAmount);
}
