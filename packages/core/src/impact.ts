/** Simulated cents-per-verified-minute used to compute a demo "impact" figure. Not real money. */
export const SIMULATED_CENTS_PER_MINUTE = 2;

export interface ImpactSplit {
  dependencyId: string;
  simulatedAmount: number;
}

/**
 * Splits a session's simulated impact evenly across its project's dependencies.
 * Amounts are in whole cents so downstream summation stays exact.
 */
export function computeImpactSplit(
  plannedDurationMin: number,
  dependencyIds: string[]
): ImpactSplit[] {
  if (dependencyIds.length === 0) return [];

  const totalCents = plannedDurationMin * SIMULATED_CENTS_PER_MINUTE;
  const baseShare = Math.floor(totalCents / dependencyIds.length);
  const remainder = totalCents - baseShare * dependencyIds.length;

  return dependencyIds.map((dependencyId, i) => ({
    dependencyId,
    // Distribute the rounding remainder across the first N dependencies.
    simulatedAmount: baseShare + (i < remainder ? 1 : 0),
  }));
}
