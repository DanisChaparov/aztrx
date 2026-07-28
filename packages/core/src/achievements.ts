import type { FocusSession } from "./types";

export interface AchievementContext {
  sessions: FocusSession[];
  streak: number;
  xp: number;
  dependenciesFunded: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_session",
    name: "First Steps",
    description: "Complete your first verified session",
    icon: "🌱",
    isUnlocked: (ctx) => ctx.sessions.some((s) => s.verified),
  },
  {
    id: "streak_3",
    name: "On a Roll",
    description: "Reach a 3-day streak",
    icon: "🔥",
    isUnlocked: (ctx) => ctx.streak >= 3,
  },
  {
    id: "streak_7",
    name: "Week Warrior",
    description: "Reach a 7-day streak",
    icon: "⚡",
    isUnlocked: (ctx) => ctx.streak >= 7,
  },
  {
    id: "streak_30",
    name: "Iron Will",
    description: "Reach a 30-day streak",
    icon: "🛡️",
    isUnlocked: (ctx) => ctx.streak >= 30,
  },
  {
    id: "sessions_10",
    name: "Getting Serious",
    description: "Complete 10 verified sessions",
    icon: "📈",
    isUnlocked: (ctx) => ctx.sessions.filter((s) => s.verified).length >= 10,
  },
  {
    id: "sessions_100",
    name: "Century Club",
    description: "Complete 100 verified sessions",
    icon: "💯",
    isUnlocked: (ctx) => ctx.sessions.filter((s) => s.verified).length >= 100,
  },
  {
    id: "deep_worker",
    name: "Deep Worker",
    description: "Complete a single verified session of 90+ minutes",
    icon: "🌊",
    isUnlocked: (ctx) => ctx.sessions.some((s) => s.verified && s.plannedDurationMin >= 90),
  },
  {
    id: "marathon",
    name: "Marathon",
    description: "Bank 1,000 verified focus-minutes",
    icon: "🏔️",
    isUnlocked: (ctx) => ctx.xp >= 1000,
  },
  {
    id: "sponsor",
    name: "Sponsor",
    description: "Fund your first open-source dependency",
    icon: "💚",
    isUnlocked: (ctx) => ctx.dependenciesFunded >= 1,
  },
  {
    id: "patron",
    name: "Patron",
    description: "Fund 10 different open-source dependencies",
    icon: "👑",
    isUnlocked: (ctx) => ctx.dependenciesFunded >= 10,
  },
];

export function getUnlockedAchievements(ctx: AchievementContext): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.isUnlocked(ctx));
}
