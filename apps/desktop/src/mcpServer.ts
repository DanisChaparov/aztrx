// Standalone MCP server — NOT run inside Electron. Spawned by the `claude`
// CLI (via --mcp-config) as a plain `node` child process during a headless
// `claude -p` invocation from chatRunner.ts. It shares the desktop app's
// already-authenticated Supabase session (read from the same session-store.json,
// located via the UPSTREAM_USERDATA_DIR env var chatRunner passes in) so it
// never needs its own separate login or API key.
import { exec } from "node:child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import { z } from "zod";
import {
  abandonSession,
  getActiveSession,
  getCommandById,
  getImpactLedgerSummary,
  getRecentCommits,
  getToolUsageSummary,
  listProjects,
  listSessions,
  queueAssistantCommand,
  startSession,
  updateProject,
  verifySession,
  type Database,
} from "@focus-forge/api-client";
import {
  calculateStreak,
  calculateXp,
  DEV_COMMAND_ALLOWLIST,
  getLevelInfo,
  isAiAssistedTool,
  LAUNCHABLE_APPS,
  matchTrackedTool,
  TRACKED_TOOL_PROCESS_NAMES,
} from "@focus-forge/core";
import { createFileStorageAdapter } from "./store";

/** Windows-only best-effort process list for "is this tool running right now"
 *  checks — other platforms just get an empty list, degrading to focused-window
 *  info only rather than erroring. */
function listRunningProcessNames(): Promise<string[]> {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve([]);
      return;
    }
    exec("tasklist /fo csv /nh", { timeout: 5000 }, (err, stdout) => {
      if (err) {
        resolve([]);
        return;
      }
      const names = stdout
        .split("\n")
        .map((line) => line.split(",")[0]?.replace(/"/g, "").trim())
        .filter((name): name is string => Boolean(name));
      resolve(names);
    });
  });
}

async function getRunningTrackedTools(): Promise<string[]> {
  const running = new Set((await listRunningProcessNames()).map((n) => n.toLowerCase()));
  return Object.entries(TRACKED_TOOL_PROCESS_NAMES)
    .filter(([, exeName]) => running.has(exeName.toLowerCase()))
    .map(([toolName]) => toolName);
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const supabase: SupabaseClient<Database> = createClient(
  requiredEnv("UPSTREAM_SUPABASE_URL"),
  requiredEnv("UPSTREAM_SUPABASE_ANON_KEY"),
  {
    auth: {
      storage: createFileStorageAdapter(requiredEnv("UPSTREAM_USERDATA_DIR")),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
    realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
  }
);

async function currentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in to Upstream — open the desktop widget and sign in first.");
  return user.id;
}

async function waitForCommandResult(commandId: string, timeoutMs: number): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const command = await getCommandById(supabase, commandId);
    if (command && command.status !== "pending") {
      if (command.status === "completed") return command.result ?? "Done.";
      if (command.status === "failed") return `Failed: ${command.result ?? "unknown error"}`;
      if (command.status === "rejected") return "Rejected locally — nothing ran.";
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return "Queued, but it hasn't finished yet — check your desktop widget.";
}

function text(value: string) {
  return { content: [{ type: "text" as const, text: value }] };
}

const server = new McpServer({ name: "upstream", version: "1.0.0" });

server.tool(
  "get_active_session",
  "Check whether the user currently has a focus session running right now, and if so, how long it's been " +
    "running and how much time is left. Read-only — use this to answer questions like 'am I in a session', " +
    "'how much time do I have left', or before deciding whether start_focus_session even makes sense.",
  {},
  async () => {
    const active = await getActiveSession(supabase);
    if (!active) return text(JSON.stringify({ active: false }));
    const elapsedMin = Math.round((Date.now() - new Date(active.startedAt).getTime()) / 60000);
    return text(
      JSON.stringify({
        active: true,
        startedAt: active.startedAt,
        plannedDurationMin: active.plannedDurationMin,
        elapsedMin,
        remainingMin: Math.max(0, active.plannedDurationMin - elapsedMin),
      })
    );
  }
);

server.tool(
  "get_current_activity",
  "Check what's happening on the user's computer RIGHT NOW — not historical totals. Returns the currently " +
    "focused app/window, and which tracked IDEs/AI coding tools (Cursor, VS Code, JetBrains IDEs, etc.) are " +
    "currently running even if not the focused window. Use this for real-time questions like 'what am I doing " +
    "right now', 'is Cursor open', or 'what's Claude doing'.",
  {},
  async () => {
    // Pure-ESM package — dynamic import() from this CJS-bundled process, same
    // reason as apps/desktop/src/activityMonitor.ts.
    const { activeWindow } = await import("active-win");
    const window = await activeWindow();
    const focusedAppName = window?.owner?.name ?? null;
    const focusedTool = focusedAppName ? matchTrackedTool(focusedAppName, undefined, window?.title) : null;

    const runningTools = await getRunningTrackedTools();

    return text(
      JSON.stringify({
        focusedApp: focusedAppName,
        focusedTool: focusedTool?.name ?? null,
        focusedToolIsAiAssisted: focusedTool?.aiAssisted ?? false,
        windowTitle: window?.title ?? null,
        runningTools,
      })
    );
  }
);

server.tool(
  "get_dashboard_stats",
  "Get the current user's real focus streak, level, XP, and session counts.",
  {},
  async () => {
    const sessions = await listSessions(supabase, { limit: 1000 });
    const streak = calculateStreak(sessions);
    const xp = calculateXp(sessions);
    const levelInfo = getLevelInfo(xp);
    return text(
      JSON.stringify({
        streak,
        level: levelInfo.level,
        xp,
        xpIntoLevel: levelInfo.xpIntoLevel,
        xpForNextLevel: levelInfo.xpForNextLevel,
        totalSessions: sessions.length,
        verifiedSessions: sessions.filter((s) => s.verified).length,
      })
    );
  }
);

server.tool("list_projects", "List the current user's projects.", {}, async () => {
  const projects = await listProjects(supabase);
  return text(
    JSON.stringify(
      projects.map((p) => ({
        name: p.name,
        deadline: p.deadline,
        githubLinked: !!p.githubRepoUrl,
        hasLocalFolder: !!p.localPath,
      }))
    )
  );
});

server.tool(
  "start_focus_session",
  "Start a new focus session for the user. Only call this when the user clearly asks to start one.",
  {
    plannedDurationMinutes: z.number().int().positive().describe("Session length in minutes"),
    projectName: z.string().optional().describe("Name of an existing project to attach this session to"),
  },
  async ({ plannedDurationMinutes, projectName }) => {
    const userId = await currentUserId();
    const active = await getActiveSession(supabase);
    if (active) return text("There's already an active focus session running.");

    let projectId: string | null = null;
    if (projectName) {
      const projects = await listProjects(supabase);
      const match = projects.find((p) => p.name.toLowerCase() === projectName.toLowerCase());
      if (!match) return text(`No project named "${projectName}" found.`);
      projectId = match.id;
    }

    const session = await startSession(supabase, { userId, projectId, plannedDurationMin: plannedDurationMinutes });
    return text(`Started a ${plannedDurationMinutes}-minute focus session. Session ID ${session.id}.`);
  }
);

server.tool(
  "end_focus_session",
  "Finish the user's current active focus session and run GitHub verification on it.",
  {},
  async () => {
    const active = await getActiveSession(supabase);
    if (!active) return text("There's no active focus session to finish.");
    const result = await verifySession(supabase, active.id);
    return text(
      JSON.stringify({
        verified: result.verified,
        distractionEventCount: result.distractionEventCount,
        githubActivityDetected: result.githubActivityDetected,
        dependenciesFunded: result.impactEntries.length,
      })
    );
  }
);

server.tool(
  "abandon_focus_session",
  "Give up on the user's current active focus session without verification.",
  {},
  async () => {
    const active = await getActiveSession(supabase);
    if (!active) return text("There's no active focus session to abandon.");
    await abandonSession(supabase, active.id);
    return text("Session abandoned — no XP or verification for this one.");
  }
);

server.tool(
  "update_project",
  "Update an existing project's name, deadline, or linked GitHub repo.",
  {
    projectName: z.string(),
    newName: z.string().optional(),
    deadline: z.string().optional().describe("ISO date, or the literal string 'none' to clear it"),
    githubRepoUrl: z.string().optional().describe("or the literal string 'none' to unlink"),
  },
  async ({ projectName, newName, deadline, githubRepoUrl }) => {
    const projects = await listProjects(supabase);
    const match = projects.find((p) => p.name.toLowerCase() === projectName.toLowerCase());
    if (!match) return text(`No project named "${projectName}" found.`);
    const updated = await updateProject(supabase, match.id, {
      name: newName,
      deadline: deadline === undefined ? undefined : deadline === "none" ? null : new Date(deadline).toISOString(),
      githubRepoUrl: githubRepoUrl === undefined ? undefined : githubRepoUrl === "none" ? null : githubRepoUrl,
    });
    return text(`Updated "${updated.name}".`);
  }
);

server.tool(
  "get_session_history",
  "Get the user's recent focus session history and total simulated impact funded.",
  { limit: z.number().int().positive().max(50).optional() },
  async ({ limit }) => {
    const [sessions, impactSummary] = await Promise.all([
      listSessions(supabase, { limit: limit ?? 10 }),
      getImpactLedgerSummary(supabase),
    ]);
    return text(
      JSON.stringify({
        sessions: sessions.map((s) => ({
          startedAt: s.startedAt,
          durationMin: s.plannedDurationMin,
          status: s.status,
          verified: s.verified,
        })),
        totalImpactCents: impactSummary.reduce((sum, d) => sum + d.totalSimulatedAmount, 0),
        dependenciesFunded: impactSummary.length,
      })
    );
  }
);

server.tool(
  "get_recent_commits",
  "Get the user's most recent real GitHub commits captured from their verified focus sessions, newest first, " +
    "including which project each one belongs to. Use this for any question about what the user has been " +
    "working on or committed recently.",
  { limit: z.number().int().positive().max(20).optional() },
  async ({ limit }) => {
    const commits = await getRecentCommits(supabase, limit ?? 5);
    if (commits.length === 0) return text("No commits captured yet — they're recorded when a focus session verifies against GitHub activity.");
    return text(
      JSON.stringify(
        commits.map((c) => ({
          project: c.projectName ?? "(no project)",
          message: c.message,
          sha: c.sha.slice(0, 7),
          committedAt: c.committedAt,
        }))
      )
    );
  }
);

server.tool(
  "get_tool_usage",
  "Get a breakdown of which apps/tools the user used during verified sessions, tagging AI coding assistants.",
  {},
  async () => {
    const usage = await getToolUsageSummary(supabase);
    if (usage.length === 0) return text("No tool usage recorded yet.");
    return text(
      JSON.stringify(
        usage.map((u) => ({
          tool: u.appName,
          minutes: Math.round(u.totalSeconds / 60),
          isAiCodingAssistant: isAiAssistedTool(u.appName),
        }))
      )
    );
  }
);

server.tool(
  "launch_app",
  "Launch a named app on the user's computer.",
  { appName: z.enum(LAUNCHABLE_APPS) },
  async ({ appName }) => {
    const userId = await currentUserId();
    const command = await queueAssistantCommand(supabase, { userId, type: "launch_app", payload: { appName } });
    return text(await waitForCommandResult(command.id, 8000));
  }
);

server.tool(
  "run_dev_command",
  `Run one of a fixed set of safe dev commands (${DEV_COMMAND_ALLOWLIST.map((c) => c.label).join(", ")}) in a project's local folder.`,
  {
    commandId: z.enum(DEV_COMMAND_ALLOWLIST.map((c) => c.id) as [string, ...string[]]),
    projectName: z.string(),
  },
  async ({ commandId, projectName }) => {
    const userId = await currentUserId();
    const projects = await listProjects(supabase);
    const match = projects.find((p) => p.name.toLowerCase() === projectName.toLowerCase());
    if (!match) return text(`No project named "${projectName}" found.`);
    if (!match.localPath) return text(`"${match.name}" has no local folder configured.`);
    const command = await queueAssistantCommand(supabase, {
      userId,
      type: "run_dev_command",
      payload: { commandId, projectId: match.id },
    });
    return text(await waitForCommandResult(command.id, 15000));
  }
);

server.tool(
  "run_shell_command",
  "Run an arbitrary shell command on the user's computer. Requires the user to explicitly confirm the exact command locally before anything runs.",
  { command: z.string(), projectName: z.string().optional() },
  async ({ command: shellCommand, projectName }) => {
    const userId = await currentUserId();
    let projectId: string | null = null;
    if (projectName) {
      const projects = await listProjects(supabase);
      projectId = projects.find((p) => p.name.toLowerCase() === projectName.toLowerCase())?.id ?? null;
    }
    await queueAssistantCommand(supabase, {
      userId,
      type: "run_shell",
      payload: { command: shellCommand, projectId },
    });
    return text(`Sent "${shellCommand}" for local confirmation — nothing runs until approved on the desktop widget.`);
  }
);

// Top-level await isn't valid in a CJS bundle (this esbuilds to CJS to match
// the rest of the desktop app) — an async IIFE gets the same effect.
(async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
})();
