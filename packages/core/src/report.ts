// "Wrapped for developers" — structured report generation.
// Deterministic (no AI call needed). Takes a date range + user data and produces
// a shareable report that can be rendered as a page or (eventually) an image.

import type { FocusSession } from "./types";
import { calculateStreak } from "./streak";
import { calculateXp, getLevelInfo } from "./gamification";
import { getUnlockedAchievements } from "./achievements";

// ── types ────────────────────────────────────────────────────────────────────

export interface ReportStat {
  label: string;
  value: string;
  /** Optional comparative note, e.g. "+40% vs last month". */
  comparison?: string;
}

export interface DeveloperType {
  name: string;
  description: string;
}

export interface DeveloperReport {
  period: { start: string; end: string; label: string };
  headline: string;
  stats: ReportStat[];
  developerType: DeveloperType;
  highlights: string[];
  achievements: string[];
  yearProgress?: YearBar[];
}

export interface YearBar {
  month: string;    // "Jan", "Feb", ...
  sessions: number;
  minutes: number;
}

// ── developer types ──────────────────────────────────────────────────────────

function classifyDeveloper(
  sessions: FocusSession[],
  peakHour: number | null,
  languages: string[],
  finishedRatio: number
): DeveloperType {
  if (peakHour != null && peakHour >= 22 || (peakHour != null && peakHour < 6)) {
    return { name: "Night Builder", description: "You build things. At night. Alone. And you finish more than you start — that's rarer than you think." };
  }
  if (peakHour != null && peakHour < 9) {
    return { name: "Morning Architect", description: "You design solutions before the world wakes up. Your best code ships before breakfast." };
  }
  if (languages.length >= 3) {
    return { name: "Polyglot Explorer", description: "You move between languages fluidly. New tech excites you more than it intimidates you." };
  }
  if (finishedRatio > 0.6) {
    return { name: "Relentless Shipper", description: "You finish what you start. In a world of half-built side projects, you actually deliver." };
  }
  if (sessions.filter((s) => s.verified).length >= 50) {
    return { name: "Steady Craftsman", description: "You show up every day and put in the work. No drama, just consistent output." };
  }
  return { name: "Rising Developer", description: "You're building the habit. Every verified session is a brick in a foundation that will hold real weight." };
}

// ── month labels ─────────────────────────────────────────────────────────────

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── report builder ───────────────────────────────────────────────────────────

export interface ReportInput {
  sessions: FocusSession[];
  languages: string[];
  previousPeriodSessions?: FocusSession[];
  period: "weekly" | "monthly" | "yearly";
  /** ISO date anchoring the period. Defaults to now. */
  anchor?: string;
  /** Peak coding hour from the developer twin. */
  peakHour?: number | null;
  /**
   * User's timezone offset in minutes. Positive = east of UTC
   * (e.g. IST = +330, EST = -300). Defaults to 0 (UTC).
   * Used for period boundaries — a "November 2025" report should cover
   * Nov 1–30 in the user's timezone, not UTC.
   */
  timezoneOffset?: number;
}

export function buildReport(input: ReportInput): DeveloperReport {
  const tz = input.timezoneOffset ?? 0;
  const anchorRaw = input.anchor ? new Date(input.anchor) : new Date();

  // Build a "local anchor" — a Date whose UTC fields represent the user's local
  // date/time, so getUTC*() calls return local components.
  const localMs = anchorRaw.getTime() + tz * 60_000;
  const anchor = new Date(localMs);

  const verified = input.sessions.filter((s) => s.verified);

  let start: Date;
  let end: Date;
  let label: string;

  switch (input.period) {
    case "weekly": {
      const day = anchor.getUTCDay();
      // Build start as local Monday 00:00, then convert back to real UTC for
      // timestamp comparisons.
      const monLocal = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() - day, 0, 0, 0, 0);
      start = new Date(monLocal - tz * 60_000);
      end = new Date(start.getTime() + 7 * 24 * 60 * 60_000);
      label = `Week of ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
      break;
    }
    case "monthly": {
      const monLocal = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1, 0, 0, 0, 0);
      start = new Date(monLocal - tz * 60_000);
      const endLocal = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1, 0, 0, 0, 0);
      end = new Date(endLocal - tz * 60_000);
      label = `${MONTHS[anchor.getUTCMonth()]} ${anchor.getUTCFullYear()}`;
      break;
    }
    case "yearly": {
      const yearLocal = Date.UTC(anchor.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
      start = new Date(yearLocal - tz * 60_000);
      const endLocal = Date.UTC(anchor.getUTCFullYear() + 1, 0, 1, 0, 0, 0, 0);
      end = new Date(endLocal - tz * 60_000);
      label = `${anchor.getUTCFullYear()}`;
      break;
    }
  }

  const inRange = verified.filter((s) => {
    const t = new Date(s.startedAt).getTime();
    return t >= start.getTime() && t < end.getTime();
  });

  const prevVerified = input.previousPeriodSessions?.filter((s) => s.verified) ?? [];
  const prevInRange = prevVerified.filter((s) => {
    const t = new Date(s.startedAt).getTime();
    return t >= start.getTime() && t < end.getTime();
  });

  const streak = calculateStreak(input.sessions, new Date(), tz);
  const xp = calculateXp(input.sessions);
  const periodXp = calculateXp(inRange);
  const level = getLevelInfo(xp);

  // Stats
  const stats: ReportStat[] = [
    { label: "Verified sessions", value: String(inRange.length), comparison: prevInRange.length ? `${percentChange(prevInRange.length, inRange.length)} vs previous` : undefined },
    { label: "Focus minutes", value: String(periodXp), comparison: prevInRange.length ? `${percentChange(calculateXp(prevInRange), periodXp)} vs previous` : undefined },
    { label: "Current streak", value: `${streak} days` },
    { label: "Developer level", value: `Level ${level.level}` },
  ];

  // Commit count from sessions (if available from commit tracking).
  const commitsInRange = input.sessions
    .filter((s) => s.verified && s.endedAt)
    .filter((s) => {
      const t = new Date(s.endedAt!).getTime();
      return t >= start.getTime() && t < end.getTime();
    }).length;
  if (commitsInRange > 0) {
    stats.push({ label: "Sessions with commits", value: String(commitsInRange) });
  }

  // Highlights
  const highlights: string[] = [];
  if (streak >= 7) highlights.push(`Longest streak yet: ${streak} days`);
  if (periodXp > 0 && input.previousPeriodSessions) {
    const prevXp = calculateXp(prevInRange);
    if (prevXp > 0 && periodXp > prevXp * 1.2) highlights.push(`Most productive ${input.period === "monthly" ? "month" : "week"} yet`);
  }
  if (input.languages.length > (input.previousPeriodSessions ? 0 : 0)) {
    highlights.push(`New language${input.languages.length > 1 ? "s" : ""} detected: ${input.languages.join(", ")}`);
  }
  if (inRange.some((s) => s.plannedDurationMin >= 90)) {
    highlights.push("Deep work session completed (90+ minutes)");
  }

  // Achievements newly unlocked in this period
  const ctx = { sessions: input.sessions, streak, xp, dependenciesFunded: 0 };
  const unlocked = getUnlockedAchievements(ctx);
  const achievementNames = unlocked.map((a) => a.name);

  // Year progress bars (only for yearly)
  let yearProgress: YearBar[] | undefined;
  if (input.period === "yearly") {
    yearProgress = MONTHS.map((month, i) => {
      const monthLocal = Date.UTC(anchor.getUTCFullYear(), i, 1, 0, 0, 0, 0);
      const monthStart = new Date(monthLocal - tz * 60_000);
      const monthEndLocal = Date.UTC(anchor.getUTCFullYear(), i + 1, 1, 0, 0, 0, 0);
      const monthEnd = new Date(monthEndLocal - tz * 60_000);
      const monthSessions = verified.filter((s) => {
        const t = new Date(s.startedAt).getTime();
        return t >= monthStart.getTime() && t < monthEnd.getTime();
      });
      return {
        month,
        sessions: monthSessions.length,
        minutes: calculateXp(monthSessions),
      };
    });
  }

  // Developer type
  const finishedRatio = input.sessions.length > 0
    ? input.sessions.filter((s) => s.status === "completed").length / input.sessions.length
    : 0;
  const devType = classifyDeveloper(input.sessions, input.peakHour ?? null, input.languages, finishedRatio);

  return {
    period: { start: start.toISOString(), end: end.toISOString(), label },
    headline: `Your ${label} in Code`,
    stats,
    developerType: devType,
    highlights: highlights.length > 0 ? highlights : ["You showed up. That counts."],
    achievements: achievementNames,
    yearProgress,
  };
}

function percentChange(prev: number, current: number): string {
  if (prev === 0) return current > 0 ? "+100%" : "—";
  const change = Math.round(((current - prev) / prev) * 100);
  if (change === 0) return "—";
  return change > 0 ? `+${change}%` : `${change}%`;
}
