import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { resolvePublicProfile } from "@focus-forge/api-client";
import {
  analyseClock,
  analyseHabits,
  analyseLanguages,
  analyseProjectLifecycle,
  buildInsights,
  type TwinRepo,
} from "@focus-forge/core";
import { Logo } from "@/components/Logo";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/** Kept in step with the private twin so a shared page says the same thing. */
const REPOS_TO_INSPECT = 12;
const REPOS_FOR_CLOCK = 5;

interface GithubRepo {
  name: string;
  language: string | null;
  fork: boolean;
  created_at: string;
  pushed_at: string;
}

/**
 * Unauthenticated GitHub reads. Public data only — this page never sees a
 * token, which is what lets it be rendered for a visitor who isn't signed in.
 * Rate limits are low without auth, so responses are cached for an hour.
 */
async function github<T>(path: string): Promise<T | null> {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: "application/vnd.github+json" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} — Upstream`,
    description: `How ${username} actually codes, read from their real GitHub history.`,
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await getServerSupabaseClient();

  // Only profiles whose owner switched sharing on. Nobody gets a page built
  // about them because someone typed their name into the URL.
  const profile = await resolvePublicProfile(supabase, username);
  if (!profile) notFound();

  const handle = profile.githubUsername;
  const repos = await github<GithubRepo[]>(`/users/${handle}/repos?per_page=100&sort=pushed`);
  if (!repos || repos.length === 0) notFound();

  const owned = repos.filter((repo) => !repo.fork);

  const listings = await Promise.all(
    owned.slice(0, REPOS_TO_INSPECT).map(async (repo) => {
      const contents = await github<{ name: string }[]>(`/repos/${handle}/${repo.name}/contents/`);
      return [repo.name, Array.isArray(contents) ? contents.map((entry) => entry.name) : []] as const;
    })
  );
  const entriesByRepo = new Map(listings);

  const twinRepos: TwinRepo[] = repos.map((repo) => ({
    name: repo.name,
    language: repo.language,
    isFork: repo.fork,
    createdAt: repo.created_at,
    lastPushedAt: repo.pushed_at,
    topLevelEntries: entriesByRepo.get(repo.name) ?? [],
  }));

  const timestamps: string[] = [];
  await Promise.all(
    owned.slice(0, REPOS_FOR_CLOCK).map(async (repo) => {
      const commits = await github<{ commit: { author: { date: string } | null } }[]>(
        `/repos/${handle}/${repo.name}/commits?author=${handle}&per_page=30`
      );
      for (const commit of commits ?? []) {
        if (commit.commit.author?.date) timestamps.push(commit.commit.author.date);
      }
    })
  );

  const lifecycle = analyseProjectLifecycle(twinRepos);
  const habits = analyseHabits(twinRepos);
  const languages = analyseLanguages(twinRepos);
  const clock = analyseClock(timestamps);
  const insights = buildInsights(lifecycle, habits, languages, clock);

  const stats = [
    { value: String(lifecycle.total), label: "projects started" },
    { value: String(lifecycle.stillAlive), label: "still alive" },
    ...(lifecycle.medianLifespanDays !== null
      ? [{ value: `${lifecycle.medianLifespanDays}d`, label: "typical lifespan" }]
      : []),
    ...(clock ? [{ value: `${clock.peakHour}:00`, label: "peak hour" }] : []),
    ...(languages.length > 0 ? [{ value: languages[0].language, label: "home language" }] : []),
  ];

  return (
    <main className="min-h-screen bg-[#0b0c10] px-6 py-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-inter text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{handle}</h1>
          <p className="font-inter text-[17px] leading-relaxed text-[#A1A1AA]">
            How they actually code, read from real GitHub history.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 border-y border-white/[0.07] py-6 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5">
              <span className="font-manrope text-2xl font-semibold text-white">{stat.value}</span>
              <span className="font-inter text-xs text-[#A1A1AA]">{stat.label}</span>
            </div>
          ))}
        </div>

        {insights.length === 0 ? (
          <p className="font-inter text-[15px] text-[#A1A1AA]">
            Nothing stands out strongly enough to call a pattern yet.
          </p>
        ) : (
          <div className="flex flex-col gap-7">
            {insights.map((insight) => (
              <div key={insight.title} className="flex flex-col gap-1.5">
                <h2 className="font-inter text-lg font-semibold text-white">{insight.title}</h2>
                <p className="font-inter text-[15px] leading-relaxed text-[#A1A1AA]">{insight.detail}</p>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#0e0f14] px-5 py-4 transition-colors hover:border-white/25"
        >
          <Logo size={26} />
          <span className="font-inter text-sm text-[#A1A1AA]">
            <span className="font-semibold text-white">Upstream</span> — see your own
          </span>
        </Link>
      </div>
    </main>
  );
}
