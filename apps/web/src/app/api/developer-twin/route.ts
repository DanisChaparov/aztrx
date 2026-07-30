import { NextResponse } from "next/server";
import {
  analyseClock,
  analyseHabits,
  analyseLanguages,
  analyseProjectLifecycle,
  buildInsights,
  type TwinRepo,
} from "@focus-forge/core";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/** Repos to inspect the file listing of. Each costs a request, and the pattern
 *  is clear long before the tail of a large account. */
const REPOS_TO_INSPECT = 12;
/** Recent commits sampled for the time-of-day pattern. */
const COMMITS_PER_REPO = 30;
const REPOS_FOR_CLOCK = 5;

interface GithubRepo {
  name: string;
  language: string | null;
  fork: boolean;
  created_at: string;
  pushed_at: string;
}

async function github<T>(path: string, token: string): Promise<T | null> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
    // Someone's history barely moves within a session, and these are the
    // heaviest calls in the app — let Next cache them for an hour.
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function GET() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("github_access_token, github_username")
    .eq("id", user.id)
    .single();

  const token = profile?.github_access_token;
  const username = profile?.github_username;
  if (!token || !username) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });
  }

  // Public repos only — this deliberately needs no `repo` scope, so the twin
  // works for someone who has granted nothing beyond their profile.
  const repos = await github<GithubRepo[]>(`/users/${username}/repos?per_page=100&sort=pushed`, token);
  if (!repos || repos.length === 0) {
    return NextResponse.json({ ready: false, reason: "No public repositories found." });
  }

  const owned = repos.filter((repo) => !repo.fork);

  // File listings, for tests/CI/README habits. Failures are tolerated per repo:
  // an empty repo 404s here, and one missing listing shouldn't sink the twin.
  const listings = await Promise.all(
    owned.slice(0, REPOS_TO_INSPECT).map(async (repo) => {
      const contents = await github<{ name: string }[]>(`/repos/${username}/${repo.name}/contents/`, token);
      return { name: repo.name, entries: Array.isArray(contents) ? contents.map((entry) => entry.name) : [] };
    })
  );
  const entriesByRepo = new Map(listings.map((listing) => [listing.name, listing.entries]));

  const twinRepos: TwinRepo[] = repos.map((repo) => ({
    name: repo.name,
    language: repo.language,
    isFork: repo.fork,
    createdAt: repo.created_at,
    lastPushedAt: repo.pushed_at,
    topLevelEntries: entriesByRepo.get(repo.name) ?? [],
  }));

  const commitTimestamps: string[] = [];
  await Promise.all(
    owned.slice(0, REPOS_FOR_CLOCK).map(async (repo) => {
      const commits = await github<{ commit: { author: { date: string } | null } }[]>(
        `/repos/${username}/${repo.name}/commits?author=${username}&per_page=${COMMITS_PER_REPO}`,
        token
      );
      for (const commit of commits ?? []) {
        if (commit.commit.author?.date) commitTimestamps.push(commit.commit.author.date);
      }
    })
  );

  const lifecycle = analyseProjectLifecycle(twinRepos);
  const habits = analyseHabits(twinRepos);
  const languages = analyseLanguages(twinRepos);
  const clock = analyseClock(commitTimestamps);

  return NextResponse.json({
    ready: true,
    username,
    lifecycle,
    habits,
    languages: languages.slice(0, 5),
    clock,
    insights: buildInsights(lifecycle, habits, languages, clock),
  });
}
