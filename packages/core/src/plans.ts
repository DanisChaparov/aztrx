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
  /** Always-on ambient activity tracking (the data foundation for AI mentor). */
  ambientTracking: boolean;
  /** Strengths, weaknesses, and growth path analysis. */
  developerProfile: boolean;
  /** Full monthly "Wrapped for developers" report. */
  monthlyReport: boolean;
  /** Yearly "Wrapped" report with month-by-month bars. */
  yearlyReport: boolean;
  /** Built-in AI mentor interactions per day (nudges, Q&A).
   *  0 = user must bring their own API key or Claude Code subscription. */
  aiMentorInteractionsPerDay: number;
  /** Language/tech progression visualization (skill graph). */
  skillGraph: boolean;
  /** Hourly ambient activity timeline on the dashboard. */
  ambientTimeline: boolean;
}

/**
 * The free tier is deliberately generous: verification, streaks, blocking, the
 * developer twin and the public profile are the whole point of the product, and
 * putting any of them behind a wall would leave nothing worth sharing. What's
 * reserved for paid is the AI-powered insight layer — the features that cost
 * real money to run (AI tokens) or that turn tracking into coaching.
 */
export const PLAN_FEATURES: Record<Plan, PlanFeatures> = {
  free: {
    privateRepoVerification: false,
    exportableProof: false,
    historyDays: 90,
    assistantFollowUps: true,
    maxProjects: 3,
    ambientTracking: false,
    developerProfile: false,
    monthlyReport: false,
    yearlyReport: false,
    aiMentorInteractionsPerDay: 5, // generous enough to try the feature
    skillGraph: false,
    ambientTimeline: false,
  },
  pro: {
    privateRepoVerification: true,
    exportableProof: true,
    historyDays: Number.POSITIVE_INFINITY,
    assistantFollowUps: true,
    maxProjects: Number.POSITIVE_INFINITY,
    ambientTracking: true,
    developerProfile: true,
    monthlyReport: true,
    yearlyReport: true,
    aiMentorInteractionsPerDay: 15, // 10 nudges + 5 deep analyses
    skillGraph: true,
    ambientTimeline: true,
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
 *
 * Set to true once POLAR_ACCESS_TOKEN is configured on Vercel and the
 * webhook endpoint has been tested end-to-end.
 */
export const BILLING_LIVE = true;

export function can(plan: Plan, feature: keyof PlanFeatures): boolean {
  if (!BILLING_LIVE) {
    const value = PLAN_FEATURES.pro[feature];
    return typeof value === "boolean" ? value : true;
  }
  const value = featuresFor(plan)[feature];
  return typeof value === "boolean" ? value : true;
}

export function limitFor(plan: Plan, feature: keyof PlanFeatures): number {
  if (!BILLING_LIVE) {
    const val = PLAN_FEATURES.pro[feature];
    return typeof val === "number" ? val : Number.POSITIVE_INFINITY;
  }
  const val = featuresFor(plan)[feature];
  return typeof val === "number" ? val : Number.POSITIVE_INFINITY;
}

/**
 * Which features are actually built vs. planned for a future release.
 * Used by the plans page to show "Coming soon" badges instead of checkmarks
 * for features that are in the plan definition but not yet implemented.
 */
export const FEATURE_STATUS: Record<keyof PlanFeatures, "live" | "coming-soon"> = {
  privateRepoVerification: "live",
  exportableProof: "coming-soon",
  historyDays: "live",
  assistantFollowUps: "live",
  maxProjects: "live",
  ambientTracking: "live",
  developerProfile: "live",
  monthlyReport: "live",
  yearlyReport: "live",
  aiMentorInteractionsPerDay: "live",
  skillGraph: "coming-soon",
  ambientTimeline: "live",
};
