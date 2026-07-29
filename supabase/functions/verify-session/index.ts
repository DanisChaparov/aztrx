// Supabase Edge Function (Deno runtime).
//
// Called by the web app when a focus session ends. Runs server-side so the
// user's GitHub token and the pass/fail verification logic can't be spoofed
// from the client. Mirrors the small rules in packages/core/src/verification.ts
// and packages/core/src/impact.ts — duplicated here (not imported) because this
// function runs on Deno while packages/core is built for the Node/web workspace.
import { createClient } from "jsr:@supabase/supabase-js@2";

const DISTRACTION_TOLERANCE = 1;
const SIMULATED_CENTS_PER_MINUTE = 2;

interface VerifyRequestBody {
  sessionId: string;
  // Only the desktop app can compute this (real filesystem access to a
  // project's local folder) — web/extension callers omit it, which is
  // equivalent to null and falls back to the GitHub-only check below.
  localActivityDetected?: boolean | null;
}

function splitImpact(plannedDurationMin: number, dependencyIds: string[]) {
  if (dependencyIds.length === 0) return [];
  const totalCents = plannedDurationMin * SIMULATED_CENTS_PER_MINUTE;
  const baseShare = Math.floor(totalCents / dependencyIds.length);
  const remainder = totalCents - baseShare * dependencyIds.length;
  return dependencyIds.map((dependencyId, i) => ({
    dependencyId,
    simulatedAmount: baseShare + (i < remainder ? 1 : 0),
  }));
}

function parseGithubRepo(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

// Without these, the browser's CORS preflight (OPTIONS) fails and every call
// from the web app is blocked client-side before it ever reaches this code —
// curl/server-to-server calls work fine either way, which is why this only
// breaks in a browser.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const { sessionId, localActivityDetected = null } = (await req.json()) as VerifyRequestBody;
    if (!sessionId) {
      return new Response(JSON.stringify({ error: "sessionId is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Scoped to the caller via their JWT — used only to confirm ownership.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    // Service role for the GitHub-token read and cross-table writes below.
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: session, error: sessionError } = await admin
      .from("focus_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    if (sessionError || !session || session.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Session not found" }), { status: 404, headers: corsHeaders });
    }

    const { count: distractionEventCount } = await admin
      .from("distraction_events")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId);

    let project: { id: string; github_repo_url: string | null } | null = null;
    if (session.project_id) {
      const { data } = await admin
        .from("projects")
        .select("id, github_repo_url")
        .eq("id", session.project_id)
        .single();
      project = data;
    }

    let githubActivityDetected: boolean | null = null;
    let commitDetails: {
      sha: string;
      message: string;
      htmlUrl: string;
      additions: number | null;
      deletions: number | null;
      committedAt: string | null;
    }[] = [];

    if (project?.github_repo_url) {
      const { data: profile } = await admin
        .from("profiles")
        .select("github_access_token, github_username")
        .eq("id", user.id)
        .single();

      const repoInfo = parseGithubRepo(project.github_repo_url);

      if (profile?.github_access_token && repoInfo) {
        const since = session.started_at;
        const commitsRes = await fetch(
          `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits?since=${encodeURIComponent(
            since
          )}&author=${encodeURIComponent(profile.github_username ?? "")}`,
          {
            headers: {
              Authorization: `Bearer ${profile.github_access_token}`,
              Accept: "application/vnd.github+json",
            },
          }
        );
        if (commitsRes.ok) {
          const commits = (await commitsRes.json()) as {
            sha: string;
            html_url: string;
            commit: { message: string; author: { date: string } | null };
          }[];
          githubActivityDetected = Array.isArray(commits) && commits.length > 0;

          // Cap per-commit stat lookups — each is a separate GitHub API call.
          const commitsToDetail = commits.slice(0, 10);
          commitDetails = await Promise.all(
            commitsToDetail.map(async (c) => {
              let additions: number | null = null;
              let deletions: number | null = null;
              try {
                const detailRes = await fetch(
                  `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/commits/${c.sha}`,
                  {
                    headers: {
                      Authorization: `Bearer ${profile.github_access_token}`,
                      Accept: "application/vnd.github+json",
                    },
                  }
                );
                if (detailRes.ok) {
                  const detail = (await detailRes.json()) as { stats?: { additions: number; deletions: number } };
                  additions = detail.stats?.additions ?? null;
                  deletions = detail.stats?.deletions ?? null;
                }
              } catch {
                // Stats are a nice-to-have — a failed per-commit lookup shouldn't fail verification.
              }
              return {
                sha: c.sha,
                message: c.commit.message.split("\n")[0],
                htmlUrl: c.html_url,
                additions,
                deletions,
                committedAt: c.commit.author?.date ?? null,
              };
            })
          );
        } else {
          // GitHub API failure shouldn't silently fail verification open or closed
          // without a signal — treat as "unknown" (null) rather than false.
          githubActivityDetected = null;
        }

        // Sync dependency snapshots once, from package.json, if not already synced.
        const { count: existingDeps } = await admin
          .from("dependency_snapshots")
          .select("id", { count: "exact", head: true })
          .eq("project_id", project.id);

        if (!existingDeps) {
          const pkgRes = await fetch(
            `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/package.json`,
            {
              headers: {
                Authorization: `Bearer ${profile.github_access_token}`,
                Accept: "application/vnd.github+json",
              },
            }
          );
          if (pkgRes.ok) {
            const pkgFile = await pkgRes.json();
            const decoded = atob(pkgFile.content.replace(/\n/g, ""));
            const pkgJson = JSON.parse(decoded);
            const depNames = Object.keys({
              ...(pkgJson.dependencies ?? {}),
              ...(pkgJson.devDependencies ?? {}),
            });
            if (depNames.length > 0) {
              await admin.from("dependency_snapshots").insert(
                depNames.map((name) => ({ project_id: project!.id, name, ecosystem: "npm" }))
              );
            }
          }
        }
      }
    }

    // A repo linked but no GitHub commits found no longer fails verification
    // outright if the desktop app detected real local commits during the
    // session window — genuine focused work that just hasn't been pushed yet
    // shouldn't read as "didn't happen".
    const verified =
      session.status !== "broken" &&
      (distractionEventCount ?? 0) <= DISTRACTION_TOLERANCE &&
      (githubActivityDetected !== false || localActivityDetected === true);

    await admin
      .from("focus_sessions")
      .update({ status: "completed", ended_at: new Date().toISOString(), verified })
      .eq("id", sessionId);

    if (commitDetails.length > 0) {
      // Best-effort — a missing/un-migrated table shouldn't fail a verification
      // that already succeeded and was saved on focus_sessions above.
      try {
        await admin.from("session_commits").upsert(
          commitDetails.map((c) => ({
            session_id: sessionId,
            sha: c.sha,
            message: c.message,
            html_url: c.htmlUrl,
            additions: c.additions,
            deletions: c.deletions,
            committed_at: c.committedAt,
          })),
          { onConflict: "session_id,sha" }
        );
      } catch (err) {
        console.error("Failed to persist session_commits:", err);
      }
    }

    let impactEntries: { dependencyId: string; simulatedAmount: number }[] = [];
    if (verified && project) {
      const { data: deps } = await admin
        .from("dependency_snapshots")
        .select("id")
        .eq("project_id", project.id);

      if (deps && deps.length > 0) {
        impactEntries = splitImpact(
          session.planned_duration_min,
          deps.map((d) => d.id)
        );
        await admin.from("impact_ledger").insert(
          impactEntries.map((entry) => ({
            user_id: user.id,
            session_id: sessionId,
            dependency_id: entry.dependencyId,
            simulated_amount: entry.simulatedAmount,
          }))
        );
      }
    }

    return new Response(
      JSON.stringify({
        verified,
        distractionEventCount: distractionEventCount ?? 0,
        githubActivityDetected,
        localActivityDetected,
        impactEntries,
        commits: commitDetails,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
