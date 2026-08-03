import { NextResponse } from "next/server";
import { listProjects, listSessions } from "@focus-forge/api-client";
import { getServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/necromancer
 * Body: { projectName: "my-abandoned-app" }
 *
 * Scans the user's session history and projects for the named project,
 * then generates 3 concrete steps to revive it.
 *
 * This is the "Project Necromancer" — the AI-powered abandoned project reviver.
 * Works without GitHub: uses session history + project metadata.
 */
export async function POST(request: Request) {
  const supabase = await getServerSupabaseClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectName } = (await request.json()) as { projectName?: string };
  if (!projectName) return NextResponse.json({ error: "Project name required." }, { status: 400 });

  const [projects, sessions] = await Promise.all([
    listProjects(supabase),
    listSessions(supabase, { limit: 500 }),
  ]);

  const project = projects.find((p) =>
    p.name.toLowerCase().includes(projectName.toLowerCase())
  );

  const projectSessions = sessions.filter((s) => s.projectId === project?.id);
  const lastSession = projectSessions[0];

  // Build revival steps from available data.
  const steps: Array<{ step: number; title: string; prompt: string; time: string }> = [];

  if (project) {
    // Step 1: Context recovery — what was the last thing done?
    steps.push({
      step: 1,
      title: "Recover your context",
      prompt: lastSession
        ? `I'm reviving my project "${project.name}". My last session on it was ${new Date(lastSession.startedAt).toLocaleDateString()}, lasted ${lastSession.plannedDurationMin} minutes, and was ${lastSession.verified ? "verified" : "not verified"}. Give me a 3-bullet summary of where I likely left off and what state the project is probably in based on this timeline.`
        : `I'm reviving my project "${project.name}". I haven't touched it in a while. Help me figure out where to start by asking me 5 quick questions about the project's current state.`,
      time: "5 min",
    });

    // Step 2: Dependency check — what needs updating?
    steps.push({
      step: 2,
      title: "Update dependencies and check for breakage",
      prompt: `I'm reviving "${project.name}". Run me through checking what needs updating: npm outdated, security audits, and which breaking changes I should watch for. Give me the exact commands to run.`,
      time: "15 min",
    });

    // Step 3: Ship something small
    const hasDeadline = !!project.deadline;
    steps.push({
      step: 3,
      title: hasDeadline ? `Ship before ${new Date(project.deadline!).toLocaleDateString()}` : "Ship one small thing",
      prompt: `For my project "${project.name}", suggest the smallest possible feature or fix I can ship in 30 minutes. Something that creates visible progress — a UI tweak, a README update, a test, a bugfix. Give me 3 options ranked by impact-to-effort ratio.`,
      time: "30 min",
    });
  }

  // Always add generic steps if project not found.
  if (steps.length === 0) {
    steps.push(
      { step: 1, title: "Find the repo", prompt: `Help me locate my project "${projectName}". What should I check? Local folders, GitHub, old terminals?`, time: "5 min" },
      { step: 2, title: "Open it and assess", prompt: `I found "${projectName}". Give me a checklist to assess its current state: what to look at first, what questions to answer.`, time: "15 min" },
      { step: 3, title: "Make the first commit in weeks", prompt: `For a project called "${projectName}" that's been idle, suggest the lowest-risk first commit I can make to break the ice.`, time: "20 min" }
    );
  }

  const summary = projectSessions.length > 0
    ? `Project "${project?.name || projectName}" had ${projectSessions.length} sessions, last active ${lastSession ? new Date(lastSession.startedAt).toLocaleDateString() : "unknown"}. Ready to revive.`
    : `Project "${projectName}" has no recorded sessions — fresh revival.`;

  const abandonedCount = projects.filter((p) => {
    const pSessions = sessions.filter((s) => s.projectId === p.id);
    if (pSessions.length === 0) return false;
    const last = new Date(pSessions[0].startedAt).getTime();
    return Date.now() - last > 30 * 24 * 60 * 60 * 1000;
  }).length;

  return NextResponse.json({
    project: project?.name || projectName,
    abandonedSiblings: abandonedCount,
    lastActive: lastSession?.startedAt || null,
    sessionCount: projectSessions.length,
    summary,
    steps,
    tip: "Copy each prompt into Claude Code, Cursor, or ChatGPT. Each step takes the estimated time. All three can be done in one evening.",
  });
}
