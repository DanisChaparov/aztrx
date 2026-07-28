import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";

function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

export interface LiveActivityCommit {
  sha: string;
  message: string;
  htmlUrl: string;
  committedAt: string | null;
  authorLogin: string | null;
  authorAvatarUrl: string | null;
}

export async function GET(request: Request) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("github_repo_url")
    .eq("id", projectId)
    .single();
  if (projectError || !project?.github_repo_url) {
    return NextResponse.json({ commits: [] satisfies LiveActivityCommit[] });
  }

  const repoInfo = parseGithubRepo(project.github_repo_url);
  if (!repoInfo) return NextResponse.json({ commits: [] satisfies LiveActivityCommit[] });

  const { data: profile } = await supabase
    .from("profiles")
    .select("github_access_token")
    .eq("id", user.id)
    .single();
  if (!profile?.github_access_token) {
    return NextResponse.json({ commits: [] satisfies LiveActivityCommit[] });
  }

  const res = await fetch(
    `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits?per_page=15`,
    {
      headers: {
        Authorization: `Bearer ${profile.github_access_token}`,
        Accept: "application/vnd.github+json",
      },
      // Live-feel polling shouldn't get served a stale cached response.
      cache: "no-store",
    }
  );

  if (!res.ok) {
    return NextResponse.json({ commits: [] satisfies LiveActivityCommit[] });
  }

  const raw = (await res.json()) as {
    sha: string;
    html_url: string;
    commit: { message: string; author: { date: string } | null };
    author: { login: string; avatar_url: string } | null;
  }[];

  const commits: LiveActivityCommit[] = raw.map((c) => ({
    sha: c.sha,
    message: c.commit.message.split("\n")[0],
    htmlUrl: c.html_url,
    committedAt: c.commit.author?.date ?? null,
    authorLogin: c.author?.login ?? null,
    authorAvatarUrl: c.author?.avatar_url ?? null,
  }));

  return NextResponse.json({ commits });
}
