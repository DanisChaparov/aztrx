/**
 * What each plan includes.
 *
 * Everything is free today — no payment exists, and this file is deliberately
 * the only place that decides otherwise. When subscriptions arrive, turning a
 * feature into a paid one is an edit here, not a hunt through the codebase for
 * scattered `if (isPro)` checks.
 */

export type Plan = "free" | "pro";

export interface PlanFeatures {
  /** Verify sessions against private repositories, not just public ones. */
  privateRepoVerification: boolean;
  /** Export a signed record of verified hours — the thing a freelancer bills from. */
  exportableProof: boolean;
  /** How far back history and trends go. Infinity means everything. */
  historyDays: number;
  /** Ask the assistant follow-up questions about your own data. */
  assistantFollowUps: boolean;
  /** Projects someone can track at once. */
  maxProjects: number;
}

/**
 * The free tier is deliberately generous: verification, streaks, blocking, the
 * developer twin and the public profile are the whole point of the product, and
 * putting any of them behind a wall would leave nothing worth sharing. What's
 * reserved for paid is what costs real money to run (private repo access) or
 * what someone is earning money with (billable proof of hours).
 */
export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    privateRepoVerification: false,
    exportableProof: false,
    historyDays: 90,
    assistantFollowUps: true,
    maxProjects: 3,
  },
  pro: {
    privateRepoVerification: true,
    exportableProof: true,
    historyDays: Number.POSITIVE_INFINITY,
    assistantFollowUps: true,
    maxProjects: Number.POSITIVE_INFINITY,
  },
};

export function featuresFor(plan: Plan): PlanFeatures {
  return PLAN_FEATURES[plan] ?? PLAN_FEATURES.free;
}

/**
 * Until payment exists, nothing is actually withheld. Gates are written against
 * this rather than against `featuresFor` directly, so the whole app can be
 * opened up or closed down with one flag instead of a release-wide edit — and
 * so no half-built paywall can accidentally lock out a real user.
 */
export const BILLING_LIVE = false;

export function can(plan: Plan, feature: keyof PlanFeatures): boolean {
  if (!BILLING_LIVE) {
    const value = PLAN_FEATURES.pro[feature];
    return typeof value === "boolean" ? value : true;
  }
  const value = featuresFor(plan)[feature];
  return typeof value === "boolean" ? value : true;
}

export function limitFor(plan: Plan, feature: "historyDays" | "maxProjects"): number {
  if (!BILLING_LIVE) return PLAN_FEATURES.pro[feature];
  return featuresFor(plan)[feature];
}
