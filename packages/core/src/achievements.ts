import type { FocusSession } from "./types";

export interface AchievementContext {
  sessions: FocusSession[];
  streak: number;
  xp: number;
  dependenciesFunded: number;
  /** Languages detected in the user's work (from window titles, terminal, commits).
   *  Populated by the caller; empty array means no data yet. */
  detectedLanguages?: string[];
  /** How many consecutive completed (not broken) sessions today, same project. */
  consecutiveCompletedToday?: number;
  /** Whether the user has shared their developer twin publicly. */
  publicProfileEnabled?: boolean;
  /** Count of broken sessions since the last verified one. */
  brokenSinceLastVerified?: number;
  /** Whether the user has a project that's been idle for 30+ days. */
  hasIdleProject?: boolean;
  /** Sessions started before 9am (local). */
  morningSessions?: number;
  /** Sessions started after 10pm (local). */
  nightSessions?: number;
}

export interface AchievementProgress {
  /** null = binary achievement (no partial credit). */
  current?: number;
  target?: number;
  /** Human-readable label for the progress unit ("sessions", "days", etc.). */
  unit?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: (ctx: AchievementContext) => boolean;
  /** What the user still needs to do. null = binary, just needs the condition met. */
  progress: (ctx: AchievementContext) => AchievementProgress | null;
  /** One-line nudge telling the user what to do next to unlock this. */
  hint: (ctx: AchievementContext) => string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function verified(sessions: FocusSession[]): FocusSession[] {
  return sessions.filter((s) => s.verified);
}

function hourOf(iso: string): number {
  return new Date(iso).getHours();
}

// ── achievements ─────────────────────────────────────────────────────────────

export const ACHIEVEMENTS: Achievement[] = [
  // ── streak gated ────────────────────────────────────────────────────────
  {
    id: "first_session",
    name: "First Steps",
    description: "Complete your first verified session",
    icon: "🌱",
    isUnlocked: (ctx) => verified(ctx.sessions).length >= 1,
    progress: (ctx) => {
      const c = verified(ctx.sessions).length;
      return c >= 1 ? null : { current: c, target: 1, unit: "session" };
    },
    hint: () => "Start and complete a focus session — 25 minutes is enough. We'll verify it against your GitHub commits.",
  },
  {
    id: "streak_3",
    name: "On a Roll",
    description: "Reach a 3-day streak",
    icon: "🔥",
    isUnlocked: (ctx) => ctx.streak >= 3,
    progress: (ctx) => (ctx.streak >= 3 ? null : { current: ctx.streak, target: 3, unit: "days" }),
    hint: (ctx) =>
      ctx.streak === 0
        ? "Start your first verified session today to begin a streak."
        : `You're at ${ctx.streak} ${ctx.streak === 1 ? "day" : "days"}. Complete a verified session tomorrow to keep it going.`,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Reach a 7-day streak",
    icon: "⚡",
    isUnlocked: (ctx) => ctx.streak >= 7,
    progress: (ctx) => (ctx.streak >= 7 ? null : { current: ctx.streak, target: 7, unit: "days" }),
    hint: (ctx) =>
      ctx.streak >= 3
        ? `You're more than halfway — ${7 - ctx.streak} more ${7 - ctx.streak === 1 ? "day" : "days"} to go.`
        : "A verified session every day for a week. Weekends count.",
  },
  {
    id: "streak_30",
    name: "Iron Will",
    description: "Reach a 30-day streak",
    icon: "🛡️",
    isUnlocked: (ctx) => ctx.streak >= 30,
    progress: (ctx) => (ctx.streak >= 30 ? null : { current: ctx.streak, target: 30, unit: "days" }),
    hint: (ctx) =>
      ctx.streak >= 14
        ? `Halfway there — ${30 - ctx.streak} days left. The second half is where the streak builds itself.`
        : "One verified session every day for a month. It's harder than it sounds — most developers never get here.",
  },

  // ── volume gated ────────────────────────────────────────────────────────
  {
    id: "sessions_10",
    name: "Getting Serious",
    description: "Complete 10 verified sessions",
    icon: "📈",
    isUnlocked: (ctx) => verified(ctx.sessions).length >= 10,
    progress: (ctx) => {
      const c = verified(ctx.sessions).length;
      return c >= 10 ? null : { current: c, target: 10, unit: "sessions" };
    },
    hint: (ctx) => {
      const left = 10 - verified(ctx.sessions).length;
      return `${left} more verified ${left === 1 ? "session" : "sessions"} to go. Each one is 25 minutes of real, verified work.`;
    },
  },
  {
    id: "sessions_100",
    name: "Century Club",
    description: "Complete 100 verified sessions",
    icon: "💯",
    isUnlocked: (ctx) => verified(ctx.sessions).length >= 100,
    progress: (ctx) => {
      const c = verified(ctx.sessions).length;
      return c >= 100 ? null : { current: c, target: 100, unit: "sessions" };
    },
    hint: (ctx) => {
      const c = verified(ctx.sessions).length;
      if (c === 0) return "Your first session is the hardest. Start there.";
      if (c < 10) return `${100 - c} sessions feels far away. At one a day, that's about ${Math.ceil((100 - c) / 30)} months.`;
      return `${100 - c} to go. At your pace, you'll hit this in a few months.`;
    },
  },

  // ── depth gated ─────────────────────────────────────────────────────────
  {
    id: "deep_worker",
    name: "Deep Worker",
    description: "Complete a single verified session of 90+ minutes",
    icon: "🌊",
    isUnlocked: (ctx) => verified(ctx.sessions).some((s) => s.plannedDurationMin >= 90),
    progress: () => null, // binary: you either did it or you haven't
    hint: () => "Try a 90-minute session. It's the full focus cycle — 90 minutes of deep work, then a real break.",
  },
  {
    id: "deep_dive",
    name: "Deep Dive",
    description: "Complete 3 consecutive verified sessions on the same project",
    icon: "🎯",
    isUnlocked: (ctx) => (ctx.consecutiveCompletedToday ?? 0) >= 3,
    progress: (ctx) => {
      const c = ctx.consecutiveCompletedToday ?? 0;
      return c >= 3 ? null : { current: c, target: 3, unit: "consecutive" };
    },
    hint: (ctx) => {
      const c = ctx.consecutiveCompletedToday ?? 0;
      return c === 0
        ? "Complete a session, then start another one on the same project. Three in a row without breaking."
        : `${3 - c} more consecutive ${3 - c === 1 ? "session" : "sessions"} on the same project.`;
    },
  },

  // ── endurance gated ─────────────────────────────────────────────────────
  {
    id: "marathon",
    name: "Marathon",
    description: "Bank 1,000 verified focus-minutes",
    icon: "🏔️",
    isUnlocked: (ctx) => ctx.xp >= 1000,
    progress: (ctx) => (ctx.xp >= 1000 ? null : { current: ctx.xp, target: 1000, unit: "minutes" }),
    hint: (ctx) => {
      const left = 1000 - ctx.xp;
      const sessions = Math.ceil(left / 25);
      return `${left} minutes left — about ${sessions} more 25-minute sessions.`;
    },
  },

  // ── impact gated ────────────────────────────────────────────────────────
  {
    id: "sponsor",
    name: "Sponsor",
    description: "Fund your first open-source dependency",
    icon: "💚",
    isUnlocked: (ctx) => ctx.dependenciesFunded >= 1,
    progress: (ctx) =>
      ctx.dependenciesFunded >= 1 ? null : { current: ctx.dependenciesFunded, target: 1, unit: "dependency" },
    hint: () => "Link a GitHub repo to a project and complete a verified session on it. Upstream tracks the dependencies and funds them.",
  },
  {
    id: "patron",
    name: "Patron",
    description: "Fund 10 different open-source dependencies",
    icon: "👑",
    isUnlocked: (ctx) => ctx.dependenciesFunded >= 10,
    progress: (ctx) =>
      ctx.dependenciesFunded >= 10 ? null : { current: ctx.dependenciesFunded, target: 10, unit: "dependencies" },
    hint: (ctx) => {
      const left = 10 - ctx.dependenciesFunded;
      return `${left} more ${left === 1 ? "dependency" : "dependencies"} to fund. Work across different projects — each one has its own dependency tree.`;
    },
  },

  // ── timing / rhythm ─────────────────────────────────────────────────────
  {
    id: "morning_person",
    name: "Morning Person",
    description: "Complete 5 sessions before 9am",
    icon: "🌅",
    isUnlocked: (ctx) => (ctx.morningSessions ?? 0) >= 5,
    progress: (ctx) => {
      const c = ctx.morningSessions ?? 0;
      return c >= 5 ? null : { current: c, target: 5, unit: "early sessions" };
    },
    hint: (ctx) => {
      const left = 5 - (ctx.morningSessions ?? 0);
      return left > 0
        ? `Start ${left} more ${left === 1 ? "session" : "sessions"} before 9am. Early work tends to be your best work — the data says so.`
        : "You're a morning person whether you admit it or not.";
    },
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Complete 5 sessions after 10pm",
    icon: "🦉",
    isUnlocked: (ctx) => (ctx.nightSessions ?? 0) >= 5,
    progress: (ctx) => {
      const c = ctx.nightSessions ?? 0;
      return c >= 5 ? null : { current: c, target: 5, unit: "late sessions" };
    },
    hint: (ctx) => {
      const left = 5 - (ctx.nightSessions ?? 0);
      return left > 0
        ? `Start ${left} more ${left === 1 ? "session" : "sessions"} after 10pm. Night coding has its own rhythm.`
        : "The night is your IDE.";
    },
  },

  // ── growth / learning ───────────────────────────────────────────────────
  {
    id: "polyglot",
    name: "Polyglot",
    description: "Work in 3+ different languages within 30 days",
    icon: "🗣️",
    isUnlocked: (ctx) => (ctx.detectedLanguages?.length ?? 0) >= 3,
    progress: (ctx) => {
      const c = ctx.detectedLanguages?.length ?? 0;
      return c >= 3 ? null : { current: c, target: 3, unit: "languages" };
    },
    hint: (ctx) => {
      const current = ctx.detectedLanguages ?? [];
      if (current.length === 0) return "We detect languages from your editor window titles, terminal commands, and git repos. Open a project to get started.";
      if (current.length === 1)
        return `We've only seen ${current[0]} so far. Open a project in a different language — we'll detect it automatically.`;
      return `You've used ${current.join(", ")}. One more language unlocks this — try something new.`;
    },
  },

  // ── resilience ──────────────────────────────────────────────────────────
  {
    id: "comeback",
    name: "Comeback Kid",
    description: "Complete a verified session after 3+ broken ones",
    icon: "🥊",
    isUnlocked: (ctx) => {
      const v = verified(ctx.sessions);
      if (v.length === 0) return false;
      // Find the most recent verified session and check if there were 3+ broken
      // ones between it and the previous verified session.
      const brokenAfterLastVerified =
        (ctx.brokenSinceLastVerified ?? 0) >= 3 && v.length >= 2;
      return brokenAfterLastVerified || (ctx.brokenSinceLastVerified ?? 0) >= 3 && v.length >= 1;
    },
    progress: (ctx) => {
      const b = ctx.brokenSinceLastVerified ?? 0;
      return b >= 3 ? null : { current: b, target: 3, unit: "broken sessions" };
    },
    hint: (ctx) => {
      const b = ctx.brokenSinceLastVerified ?? 0;
      if (b === 0) return "This unlocks when you bounce back. Break a few sessions (it happens), then come back and finish one.";
      return `${3 - b} more broken ${3 - b === 1 ? "session" : "sessions"} before this becomes a comeback story. Then finish one.`;
    },
  },
  {
    id: "resurrector",
    name: "Resurrector",
    description: "Reopen a project that's been idle for 30+ days",
    icon: "🪦",
    isUnlocked: (ctx) => ctx.hasIdleProject === true, // simplified — caller sets this
    progress: () => null, // binary
    hint: () =>
      "Your developer twin shows which projects are closest to finished. Pick one that's been quiet for a month and start a session on it.",
  },

  // ── social ──────────────────────────────────────────────────────────────
  {
    id: "public_twin",
    name: "Open Book",
    description: "Share your developer twin publicly",
    icon: "📖",
    isUnlocked: (ctx) => ctx.publicProfileEnabled === true,
    progress: () => null, // binary
    hint: () =>
      "Enable the 'Share your developer twin' toggle in your dashboard. It publishes a page anyone can open — no account needed.",
  },
];

// ── public API ───────────────────────────────────────────────────────────────

export function getUnlockedAchievements(ctx: AchievementContext): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.isUnlocked(ctx));
}

/** An achievement with its computed state — the dashboard's serializable shape. */
export interface ResolvedAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: AchievementProgress | null;
  hint: string;
}

/** Returns every achievement with its computed progress and hint, for the dashboard grid. */
export function getAchievementsWithProgress(ctx: AchievementContext): ResolvedAchievement[] {
  return ACHIEVEMENTS.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    icon: a.icon,
    unlocked: a.isUnlocked(ctx),
    progress: a.progress(ctx),
    hint: a.hint(ctx),
  }));
}
