import { NextResponse, type NextRequest } from "next/server";
import { buildReport, type ReportInput } from "@focus-forge/core";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * GET /api/report?period=monthly|yearly&date=2025-11
 *
 * Generates a shareable developer report ("Wrapped for developers").
 * Weekly reports are free; monthly and yearly require Pro.
 */
export async function GET(request: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const period = (request.nextUrl.searchParams.get("period") ?? "monthly") as ReportInput["period"];
  if (!["weekly", "monthly", "yearly"].includes(period)) {
    return NextResponse.json({ error: "Invalid period. Use weekly, monthly, or yearly." }, { status: 400 });
  }

  // Pro-gate monthly and yearly reports.
  if (period !== "weekly") {
    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    if (profile?.plan !== "pro") {
      return NextResponse.json({ error: "Monthly and yearly reports require Pro." }, { status: 402 });
    }
  }

  const anchor = request.nextUrl.searchParams.get("date") ?? undefined;

  const { data: sessions } = await supabase
    .from("focus_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(2000);

  // Detect languages from projects
  const { data: projects } = await supabase.from("projects").select("name, github_repo_url").eq("user_id", user.id);
  const detectedLanguages: string[] = [];
  const langHints: Record<string, string[]> = {
    typescript: ["ts", "typescript", "next", "react"],
    python: ["py", "python", "django", "flask"],
    rust: ["rs", "rust", "cargo"],
    go: ["go", "golang", "gin"],
    javascript: ["js", "javascript", "express", "node"],
    java: ["java", "spring", "kotlin"],
    ruby: ["rb", "ruby", "rails"],
    csharp: ["cs", "csharp", "dotnet", ".net"],
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
    })),
    languages: detectedLanguages,
    period,
    anchor,
  };

  const report = buildReport(input);
  return NextResponse.json(report);
}
