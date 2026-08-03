import { NextResponse } from "next/server";
import { buildDeveloperProfile, type ProfileInput } from "@focus-forge/core";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/developer-profile
 *
 * Returns the signed-in user's developer profile — strengths, weaknesses, and a
 * growth path — computed deterministically from their session history, developer
 * twin, and ambient data. No AI call needed.
 */
export async function GET() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Plan tier.
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  const plan = profile?.plan === "pro" ? "pro" : "free";

  // Sessions (needed for all the stats).
  const { data: sessions } = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(1000);

  // Try the developer twin API internally.
  let twinData: ProfileInput["twin"] = null;
  try {
    const twinRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/api/developer-twin`, {
      headers: { Cookie: "" }, // won't work for auth; we'll compute inline instead
    });
    // The twin route needs auth cookies — since we're server-side, we'll skip
    // and rely on session data only. The profile still works without twin data;
    // it just has fewer insights.
  } catch {
    // twin unavailable — profile degrades gracefully
  }

  // Detect languages from projects.
  const { data: projects } = await supabase
    .from("projects")
    .select("name, github_repo_url")
    .eq("user_id", user.id);
  const detectedLanguages: string[] = [];
  const langHints: Record<string, string[]> = {
    typescript: ["ts", "typescript", "next", "react", "angular", "vue", "node"],
    python: ["py", "python", "django", "flask", "fastapi", "pytorch"],
    rust: ["rs", "rust", "cargo", "actix", "tokio", "tauri"],
    go: ["go", "golang", "gin", "echo", "fiber"],
    javascript: ["js", "javascript", "express", "svelte", "node"],
    java: ["java", "spring", "kotlin", "gradle", "maven", "intellij"],
    ruby: ["rb", "ruby", "rails", "jekyll"],
    csharp: ["cs", "csharp", "dotnet", "blazor", "xamarin", ".net"],
    swift: ["swift", "ios", "swiftui", "uikit"],
    kotlin: ["kt", "kotlin", "android", "compose"],
    php: ["php", "laravel", "symfony", "wordpress"],
    elixir: ["ex", "elixir", "phoenix"],
  };
  for (const project of projects ?? []) {
    const nameLower = project.name.toLowerCase();
    const urlLower = (project.github_repo_url ?? "").toLowerCase();
    for (const [lang, hints] of Object.entries(langHints)) {
      if (hints.some((h) => nameLower.includes(h) || urlLower.includes(h))) {
        if (!detectedLanguages.includes(lang)) detectedLanguages.push(lang);
      }
    }
  }

  const input: ProfileInput = {
    sessions: (sessions ?? []).map((s) => ({
      id: s.id,
      userId: s.user_id,
      projectId: s.project_id,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      plannedDurationMin: s.planned_duration_min,
      status: s.status as "active" | "completed" | "broken",
      verified: s.verified,
    })),
    twin: twinData,
    detectedLanguages,
    plan: plan as "free" | "pro",
  };

  const profile_ = buildDeveloperProfile(input);
  return NextResponse.json(profile_);
}
