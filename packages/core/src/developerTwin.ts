/**
 * Builds a "Developer Twin" — a portrait of how someone actually codes, derived
 * from their real GitHub history rather than from anything they self-report.
 *
 * The point of doing this from history is that it works on day one. A tracker
 * that only knows what it has watched has nothing to say to a new user for
 * weeks, which is when most of them leave.
 *
 * Everything here is pure: callers fetch from GitHub, this decides what it
 * means. That keeps the interesting logic testable without a network.
 */

export interface TwinRepo {
  name: string;
  language: string | null;
  isFork: boolean;
  createdAt: string;
  /** Last push to the repo — GitHub's `pushed_at`. */
  lastPushedAt: string;
  /** Top-level file and directory names, used to spot tests/CI/docs habits. */
  topLevelEntries: string[];
}

/** A project is treated as abandoned once it has gone this long untouched. */
const ABANDONED_AFTER_DAYS = 90;
/** Below this, a project barely started — it never really got going. */
const SHORT_LIFE_DAYS = 14;

const TEST_MARKERS = ["test", "tests", "spec", "__tests__", "e2e", "cypress"];
const CI_MARKERS = [".github", ".gitlab-ci.yml", ".circleci", "azure-pipelines.yml", "jenkinsfile"];
const DOC_MARKERS = ["readme.md", "readme", "docs", "readme.rst"];

function daysBetween(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

function hasAnyMarker(entries: string[], markers: string[]): boolean {
  const lowered = entries.map((entry) => entry.toLowerCase());
  return markers.some((marker) => lowered.some((entry) => entry === marker || entry.startsWith(marker)));
}

export interface ProjectLifecycle {
  total: number;
  stillAlive: number;
  abandoned: number;
  /** Abandoned repos that never even got two weeks of work. */
  neverStarted: number;
  /** Median days from creation to last push, across abandoned projects. */
  medianLifespanDays: number | null;
  /** The abandoned projects that lived longest — the ones worth reviving. */
  closestToFinished: string[];
}

export function analyseProjectLifecycle(repos: TwinRepo[], now = new Date().toISOString()): ProjectLifecycle {
  // Forks aren't your projects; counting them would inflate every number here.
  const owned = repos.filter((repo) => !repo.isFork);

  const withAge = owned.map((repo) => ({
    name: repo.name,
    lifespanDays: Math.max(0, daysBetween(repo.createdAt, repo.lastPushedAt)),
    idleDays: daysBetween(repo.lastPushedAt, now),
  }));

  const abandoned = withAge.filter((repo) => repo.idleDays >= ABANDONED_AFTER_DAYS);
  const lifespans = abandoned.map((repo) => repo.lifespanDays).sort((a, b) => a - b);

  return {
    total: owned.length,
    stillAlive: withAge.length - abandoned.length,
    abandoned: abandoned.length,
    neverStarted: abandoned.filter((repo) => repo.lifespanDays < SHORT_LIFE_DAYS).length,
    medianLifespanDays: lifespans.length > 0 ? lifespans[Math.floor(lifespans.length / 2)] : null,
    closestToFinished: [...abandoned]
      .sort((a, b) => b.lifespanDays - a.lifespanDays)
      .slice(0, 3)
      .map((repo) => repo.name),
  };
}

export interface HabitSignal {
  /** Owned, non-trivial repos this was measured across. */
  sampleSize: number;
  withTests: number;
  withCi: number;
  withDocs: number;
}

export function analyseHabits(repos: TwinRepo[]): HabitSignal {
  const owned = repos.filter((repo) => !repo.isFork && repo.topLevelEntries.length > 0);
  return {
    sampleSize: owned.length,
    withTests: owned.filter((repo) => hasAnyMarker(repo.topLevelEntries, TEST_MARKERS)).length,
    withCi: owned.filter((repo) => hasAnyMarker(repo.topLevelEntries, CI_MARKERS)).length,
    withDocs: owned.filter((repo) => hasAnyMarker(repo.topLevelEntries, DOC_MARKERS)).length,
  };
}

export interface LanguageSlice {
  language: string;
  repoCount: number;
}

export function analyseLanguages(repos: TwinRepo[]): LanguageSlice[] {
  const counts = new Map<string, number>();
  for (const repo of repos) {
    if (repo.isFork || !repo.language) continue;
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([language, repoCount]) => ({ language, repoCount }))
    .sort((a, b) => b.repoCount - a.repoCount);
}

export interface CodingClock {
  /** Commits bucketed by local hour, 0–23. */
  byHour: number[];
  peakHour: number;
  /** Share of commits between 22:00 and 05:59. */
  nightShare: number;
  /** Share of commits on Saturday or Sunday. */
  weekendShare: number;
}

export function analyseClock(commitTimestamps: string[]): CodingClock | null {
  if (commitTimestamps.length === 0) return null;

  const byHour = new Array(24).fill(0) as number[];
  let night = 0;
  let weekend = 0;

  for (const timestamp of commitTimestamps) {
    const date = new Date(timestamp);
    const hour = date.getHours();
    byHour[hour] += 1;
    if (hour >= 22 || hour < 6) night += 1;
    const day = date.getDay();
    if (day === 0 || day === 6) weekend += 1;
  }

  return {
    byHour,
    peakHour: byHour.indexOf(Math.max(...byHour)),
    nightShare: night / commitTimestamps.length,
    weekendShare: weekend / commitTimestamps.length,
  };
}

export interface TwinInsight {
  /** Short headline, e.g. "You start far more than you finish". */
  title: string;
  /** The evidence. Never a claim without a number behind it. */
  detail: string;
  tone: "strength" | "weakness" | "pattern";
}

/**
 * Turns the raw analyses into things worth saying.
 *
 * Deliberately conservative: an insight is only emitted when the data actually
 * supports it and the sample is big enough to mean something. Generic advice
 * ("write more tests!") that every user sees regardless of their data is worse
 * than silence — it teaches people the product doesn't really know them.
 */
export function buildInsights(
  lifecycle: ProjectLifecycle,
  habits: HabitSignal,
  languages: LanguageSlice[],
  clock: CodingClock | null
): TwinInsight[] {
  const insights: TwinInsight[] = [];

  if (lifecycle.total >= 4 && lifecycle.abandoned / lifecycle.total > 0.6) {
    insights.push({
      title: "You start far more than you finish",
      detail:
        `${lifecycle.abandoned} of your ${lifecycle.total} projects haven't been touched in over three months` +
        (lifecycle.medianLifespanDays !== null
          ? `, and the typical one was active for just ${lifecycle.medianLifespanDays} days before going quiet.`
          : ".") +
        (lifecycle.closestToFinished.length > 0
          ? ` The one that got furthest was ${lifecycle.closestToFinished[0]} — that's the one worth reviving.`
          : ""),
      tone: "weakness",
    });
  } else if (lifecycle.total >= 4 && lifecycle.stillAlive / lifecycle.total > 0.5) {
    insights.push({
      title: "You actually finish things",
      detail: `${lifecycle.stillAlive} of your ${lifecycle.total} projects are still getting commits. Most developers' ratio is the other way round.`,
      tone: "strength",
    });
  }

  if (lifecycle.neverStarted >= 3) {
    insights.push({
      title: "A lot of projects never get past day one",
      detail: `${lifecycle.neverStarted} repos were abandoned within two weeks of being created. That's usually a sign of starting from excitement rather than from a plan.`,
      tone: "pattern",
    });
  }

  if (habits.sampleSize >= 4) {
    if (habits.withTests === 0) {
      insights.push({
        title: "No tests anywhere",
        detail: `None of your ${habits.sampleSize} projects have a test directory. This is the single most common gap between self-taught and hired developers.`,
        tone: "weakness",
      });
    } else if (habits.withTests / habits.sampleSize >= 0.5) {
      insights.push({
        title: "You write tests",
        detail: `${habits.withTests} of ${habits.sampleSize} projects have tests — well above what's typical for personal projects.`,
        tone: "strength",
      });
    }

    if (habits.withDocs / habits.sampleSize < 0.4) {
      insights.push({
        title: "Your projects are hard to walk into",
        detail: `Only ${habits.withDocs} of ${habits.sampleSize} have a README. Anyone reviewing your GitHub — including a recruiter — starts there.`,
        tone: "weakness",
      });
    }
  }

  if (languages.length >= 1 && languages[0].repoCount >= 3) {
    insights.push({
      title: `${languages[0].language} is your home language`,
      detail:
        `${languages[0].repoCount} projects` +
        (languages.length > 1 ? `, with ${languages[1].language} a distant second.` : "."),
      tone: "strength",
    });
  }

  if (clock && clock.nightShare > 0.35) {
    insights.push({
      title: "You're a night coder",
      detail: `${Math.round(clock.nightShare * 100)}% of your commits land between 10pm and 6am, peaking around ${clock.peakHour}:00.`,
      tone: "pattern",
    });
  }

  return insights;
}
