/**
 * Shared mapping from plan feature display names (FREE_FEATURES in the plans page)
 * to PlanFeatures keys in @focus-forge/core/plans.
 *
 * Always-free features (no corresponding PlanFeature key) return null — they are
 * never gated behind a subscription and never show "Coming soon" badges.
 */

const FEATURE_KEY_MAP: Record<string, string | null> = {
  // Always free — no gating
  "Focus sessions & verification": null,
  "GitHub commit verification": null,
  "Distraction blocking (desktop + extension)": null,
  "Coding streaks & heatmap": null,
  "Developer Twin (private + public share)": null,

  // Gated features
  "AI assistant via your Claude Code": "assistantFollowUps",
  "5 built-in AI mentor interactions/day": "aiMentorInteractionsPerDay",
  "15 AI mentor interactions/day": "aiMentorInteractionsPerDay",
  "3 active projects": "maxProjects",
  "90-day history": "historyDays",
  "Ambient activity tracking": "ambientTracking",
  "Developer Profile (strengths/weaknesses)": "developerProfile",
  'Monthly "Wrapped" reports': "monthlyReport",
  "Yearly report with growth trajectory": "yearlyReport",
  "Skill graph & learning path": "skillGraph",
  "Private repo verification": "privateRepoVerification",
  "Exportable proof of hours": "exportableProof",
  "Ambient timeline": "ambientTimeline",
};

export function toFeatureKey(name: string): string | null {
  return FEATURE_KEY_MAP[name] ?? null;
}
