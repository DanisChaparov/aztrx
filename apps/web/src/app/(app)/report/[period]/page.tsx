import { notFound } from "next/navigation";
import { buildReport, type ReportInput } from "@focus-forge/core";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { ReportClient } from "./ReportClient";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ period: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { period } = await params;
  const { date } = await searchParams;
  if (!["weekly", "monthly", "yearly"].includes(period)) notFound();

  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: sessions } = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(2000);

  const { data: projects } = await supabase.from("projects").select("name, github_repo_url").eq("user_id", user.id);
  const detectedLanguages: string[] = [];
  const langHints: Record<string, string[]> = {
    typescript: ["ts", "typescript", "next", "react", "angular", "vue", "svelte", "astro", "nuxt", "remix", "solid"],
    javascript: ["js", "javascript", "node", "express", "npm", "bun"],
    python: ["py", "python", "django", "flask", "fastapi", "pytorch", "tensorflow", "jupyter"],
    rust: ["rs", "rust", "cargo", "actix", "axum", "tauri"],
    go: ["go", "golang", "gin", "echo", "fiber"],
    java: ["java", "spring", "maven", "gradle", "kotlin"],
    csharp: ["cs", "csharp", "dotnet", "blazor", "unity", ".net"],
    ruby: ["rb", "ruby", "rails", "jekyll"],
    swift: ["swift", "ios", "xcode", "swiftui"],
    kotlin: ["kt", "kotlin", "android", "compose", "jetpack"],
    php: ["php", "laravel", "symfony", "wordpress"],
    elixir: ["ex", "elixir", "phoenix"],
    c: ["c", "makefile", "cmake", "embedded"],
    cpp: ["cpp", "c++", "unreal", "qt", "boost"],
    zig: ["zig", "bun"],
    dart: ["dart", "flutter"],
    r: ["r", "rstudio", "shiny", "tidyverse"],
  };
  for (const p of projects ?? []) {
    const n = p.name.toLowerCase();
    const u = (p.github_repo_url ?? "").toLowerCase();
    for (const [lang, hints] of Object.entries(langHints)) {
      if (hints.some((h) => n.includes(h) || u.includes(h)) && !detectedLanguages.includes(lang)) {
        detectedLanguages.push(lang);
      }
    }
  }

  const input: ReportInput = {
    sessions: (sessions ?? []).map((s) => ({
      id: s.id,
      userId: s.user_id,
      projectId: s.project_id,
      startedAt: s.started_at,
      endedAt: s.ended_at,
      plannedDurationMin: s.planned_duration_min,
      status: s.status as "active" | "completed" | "broken",
      verified: s.verified,
      notes: s.notes ?? null,
      tags: s.tags ?? null,
    })),
    languages: detectedLanguages,
    period: period as ReportInput["period"],
    anchor: date,
  };

  const report = buildReport(input);
  const maxMinutes = report.yearProgress ? Math.max(1, ...report.yearProgress.map((b) => b.minutes)) : 1;

  return <ReportClient report={report} maxMinutes={maxMinutes} />;
}
