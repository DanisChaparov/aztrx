// Deterministic analysis of a developer's data — no AI call needed.
// Produces strengths, weaknesses, and a growth path from the same signals
// the dashboard and developer twin already surface.

import type { FocusSession } from "./types";
import { calculateStreak } from "./streak";
import { calculateXp, getLevelInfo } from "./gamification";
import type { ProjectLifecycle, HabitSignal, CodingClock, LanguageSlice } from "./developerTwin";

// ── types ────────────────────────────────────────────────────────────────────

export interface Strength {
  title: string;
  detail: string;
}

export interface Weakness {
  title: string;
  detail: string;
}

export interface GrowthStep {
  /** Short imperative — "Add tests to one project", "Ship something small". */
  title: string;
  /** Why this step, backed by the user's own data. */
  reason: string;
  /** How many sessions roughly to complete this step. */
  estimatedSessions: number;
}

export interface DeveloperProfile {
  strengths: Strength[];
  weaknesses: Weakness[];
  growthPath: GrowthStep[];
  /** One-paragraph portrait, data-backed. */
  summary: string;
  lastUpdated: string;
}

// ── input shape ──────────────────────────────────────────────────────────────

export interface ProfileInput {
  sessions: FocusSession[];
  /** From the developer twin — null if twin hasn't been generated yet. */
  twin?: {
    lifecycle: ProjectLifecycle;
    habits: HabitSignal;
    languages: LanguageSlice[];
    clock: CodingClock | null;
  } | null;
  /** Languages detected from ambient window titles and project names. */
  detectedLanguages: string[];
  /** Plan tier — affects what growth steps are appropriate. */
  plan: "free" | "pro";
}

// ── rules ────────────────────────────────────────────────────────────────────

export function buildDeveloperProfile(input: ProfileInput): DeveloperProfile {
  const strengths: Strength[] = [];
  const weaknesses: Weakness[] = [];
  const growthPath: GrowthStep[] = [];

  const verified = input.sessions.filter((s) => s.verified);
  const streak = calculateStreak(input.sessions);
  const xp = calculateXp(input.sessions);
  const level = getLevelInfo(xp);
  const t = input.twin;

  // ── strengths ──────────────────────────────────────────────────────────

  if (streak >= 7) {
    strengths.push({
      title: "Consistent",
      detail: `You've shown up for ${streak} days in a row. Consistency beats intensity — you've proven you can sustain a habit.`,
    });
  }

  if (streak >= 3 && streak < 7) {
    strengths.push({
      title: "Building momentum",
      detail: `A ${streak}-day streak means you're forming a real habit. Most people quit before day 3.`,
    });
  }

  if (verified.length >= 50) {
    strengths.push({
      title: "Experienced",
      detail: `${verified.length} verified sessions. You've put in the hours and have the data to prove it.`,
    });
  }

  if (t?.clock?.peakHour != null) {
    const peak = t.clock.peakHour;
    const period = peak < 12 ? "morning" : peak < 18 ? "afternoon" : "evening";
    strengths.push({
      title: "Knows their rhythm",
      detail: `Your peak coding hour is ${peak}:00 — you've found your ${period} flow and you use it.`,
    });
  }

  if (t?.languages && t.languages.length >= 2) {
    strengths.push({
      title: "Polyglot mindset",
      detail: `You work across ${t.languages.map((l) => l.language).join(", ")}. Multi-language developers adapt faster to new tech.`,
    });
  } else if (t?.languages && t.languages.length === 1) {
    strengths.push({
      title: `${t.languages[0].language} specialist`,
      detail: `Deep expertise in ${t.languages[0].language}. Specialists solve problems generalists can't.`,
    });
  }

  if (t?.lifecycle && t.lifecycle.stillAlive / Math.max(1, t.lifecycle.total) > 0.5 && t.lifecycle.total >= 3) {
    strengths.push({
      title: "Finishes what they start",
      detail: `${t.lifecycle.stillAlive} of ${t.lifecycle.total} projects are still active. You ship things — most developers have the opposite ratio.`,
    });
  }

  if (input.detectedLanguages.length >= 4) {
    strengths.push({
      title: "Fast learner",
      detail: `You've touched ${input.detectedLanguages.length} different languages. That breadth means you can pick up new stacks quickly.`,
    });
  }

  // Always find at least one strength if we have any data at all.
  if (strengths.length === 0 && verified.length >= 1) {
    strengths.push({
      title: "Started",
      detail: "You've completed verified sessions. The hardest part of any habit is the first session — you're past that.",
    });
  }

  // ── weaknesses ─────────────────────────────────────────────────────────

  if (t?.habits && t.habits.sampleSize >= 4 && t.habits.withTests / t.habits.sampleSize < 0.3) {
    weaknesses.push({
      title: "Low testing habits",
      detail: `Only ${t.habits.withTests} of your ${t.habits.sampleSize} projects have tests. Untested code breaks silently, and the person who fixes it is always you.`,
    });
  }

  if (t?.lifecycle && t.lifecycle.abandoned / Math.max(1, t.lifecycle.total) > 0.6 && t.lifecycle.total >= 4) {
    weaknesses.push({
      title: "Too many unfinished projects",
      detail: `${t.lifecycle.abandoned} of ${t.lifecycle.total} projects have gone quiet. The excitement of starting is stronger than the discipline of finishing.`,
    });
  }

  if (t?.lifecycle && t.lifecycle.neverStarted >= 3) {
    weaknesses.push({
      title: "Starts but doesn't build",
      detail: `${t.lifecycle.neverStarted} repos were abandoned within two weeks of creation. You're starting from excitement, not from a plan.`,
    });
  }

  if (t?.habits && t.habits.sampleSize >= 4 && t.habits.withDocs / t.habits.sampleSize < 0.4) {
    weaknesses.push({
      title: "Projects are hard to walk into",
      detail: `Only ${t.habits.withDocs} of ${t.habits.sampleSize} projects have a README. Anyone reviewing your work — including future you — starts there.`,
    });
  }

  if (t?.clock && t.clock.nightShare > 0.35) {
    weaknesses.push({
      title: "Night-heavy schedule",
      detail: `${Math.round(t.clock.nightShare * 100)}% of your commits land between 10pm and 6am. Late-night code has more bugs and you're probably not getting enough sleep.`,
    });
  }

  if (verified.length > 10) {
    const broken = input.sessions.filter((s) => s.status === "broken").length;
    const brokenRate = broken / Math.max(1, input.sessions.length);
    if (brokenRate > 0.25) {
      weaknesses.push({
        title: "Too many broken sessions",
        detail: `${Math.round(brokenRate * 100)}% of your sessions end broken. That's usually distractions winning. Try shorter sessions — 25 minutes is harder to break than 90.`,
      });
    }
  }

  // ── growth path ────────────────────────────────────────────────────────

  // Step 1: address the biggest weakness first
  if (weaknesses.some((w) => w.title === "Low testing habits")) {
    growthPath.push({
      title: "Add tests to your most active project",
      reason: "Your data says testing is your biggest gap. Start small — one test file, one test case. The goal isn't coverage, it's the habit.",
      estimatedSessions: 2,
    });
  }

  if (weaknesses.some((w) => w.title === "Too many unfinished projects")) {
    const closest = t?.lifecycle?.closestToFinished?.[0];
    growthPath.push({
      title: closest ? `Revive "${closest}"` : "Finish one project",
      reason: closest
        ? `"${closest}" got the furthest before going quiet. It's the one most worth finishing — you already did the hard part.`
        : "Pick the project closest to done and complete it. One finished project is worth ten half-built ones.",
      estimatedSessions: 5,
    });
  }

  if (weaknesses.some((w) => w.title === "Projects are hard to walk into")) {
    growthPath.push({
      title: "Write a README for your best project",
      reason: "A README helps your future self as much as anyone else. 15 minutes, three sections: what it does, how to run it, where to start.",
      estimatedSessions: 1,
    });
  }

  // Step: level up
  if (level.level < 5) {
    growthPath.push({
      title: "Reach Level 5",
      reason: `You're Level ${level.level} with ${xp} XP. Level 5 is at ${50 * 5 * 6} XP — about ${Math.ceil((50 * 5 * 6 - xp) / 25)} more 25-minute sessions. That's when the habit starts feeling automatic.`,
      estimatedSessions: Math.max(1, Math.ceil((50 * 5 * 6 - xp) / 25)),
    });
  }

  if (t?.languages && t.languages.length >= 1 && t.languages.length <= 2) {
    const current = new Set(t.languages.map((l) => l.language.toLowerCase()));
    const suggestions = [
      { lang: "TypeScript", reason: "If you know JavaScript, TypeScript is the natural next step — same ecosystem, fewer runtime bugs." },
      { lang: "Rust", reason: "If you want to understand what your high-level language is actually doing. Steep curve, worth it." },
      { lang: "Go", reason: "Simple, fast, and excellent for the kind of backend work that pairs with any frontend." },
      { lang: "Python", reason: "If you want to add data/AI work to your toolkit. Python opens a completely different set of problems." },
    ];
    const next = suggestions.find((s) => !current.has(s.lang.toLowerCase()));
    if (next) {
      growthPath.push({
        title: `Try ${next.lang}`,
        reason: next.reason,
        estimatedSessions: 10,
      });
    }
  }

  // Generic fallback — always give at least one growth step.
  if (growthPath.length === 0) {
    growthPath.push({
      title: "Build one complete production project",
      reason: verified.length > 0
        ? "You've shown you can show up. Now apply it — pick one project, scope it to something you can finish in two weeks, and ship it."
        : "Start with a 25-minute session on any project. The hardest thing in software is starting — everything after that is iteration.",
      estimatedSessions: 20,
    });
  }

  // ── summary ────────────────────────────────────────────────────────────

  const summary = buildSummary(input, strengths, weaknesses, streak, xp, level);

  return {
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    growthPath: growthPath.slice(0, 3),
    summary,
    lastUpdated: new Date().toISOString(),
  };
}

function buildSummary(
  input: ProfileInput,
  strengths: Strength[],
  weaknesses: Weakness[],
  streak: number,
  xp: number,
  level: ReturnType<typeof getLevelInfo>
): string {
  const parts: string[] = [];

  if (input.twin?.languages && input.twin.languages.length > 0) {
    parts.push(`You're a ${input.twin.languages[0].language} developer`);
  } else {
    parts.push("You're a developer");
  }

  if (streak >= 7) {
    parts.push(`on a ${streak}-day streak`);
  }

  if (input.twin?.clock?.peakHour != null) {
    const peak = input.twin.clock.peakHour;
    const period = peak < 12 ? "morning" : peak < 18 ? "afternoon" : "night";
    parts.push(`who does their best work in the ${period}`);
  }

  if (strengths.length > 0) {
    const firstStrength = strengths[0].title.toLowerCase().replace(/\.$/, "");
    parts.push(`. Your standout trait is ${firstStrength}`);
  }

  if (weaknesses.length > 0) {
    const firstWeakness = weaknesses[0].title.toLowerCase().replace(/\.$/, "");
    parts.push(`, and the thing holding you back most is ${firstWeakness}`);
  }

  parts.push(
    `. You've banked ${xp} verified minutes across ${input.sessions.filter((s) => s.verified).length} sessions`
  );

  if (level.level > 1) {
    parts.push(`and reached Level ${level.level}`);
  }

  parts.push(".");

  return parts.join("");
}
