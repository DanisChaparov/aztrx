import { exec } from "node:child_process";
import { BrowserWindow, dialog, shell } from "electron";
import {
  getPendingCommands,
  listProjects,
  updateCommandStatus,
  type Database,
} from "@focus-forge/api-client";
import { DEV_COMMAND_ALLOWLIST, type LaunchableApp } from "@focus-forge/core";
import type { SupabaseClient } from "@supabase/supabase-js";

const POLL_INTERVAL_MS = 1000;
const EXEC_TIMEOUT_MS = 60_000;
const MAX_OUTPUT_CHARS = 4000;

// Best-effort — Windows has no universal "open by friendly name" API, so this
// tries the CLI/protocol each app is most likely to have registered. A miss
// here reports back honestly rather than silently doing nothing.
const LAUNCH_COMMANDS: Partial<Record<LaunchableApp, string>> = {
  Cursor: "cursor",
  "Visual Studio Code": "code",
  Antigravity: "antigravity",
  Windsurf: "windsurf",
  Terminal: process.platform === "win32" ? "wt" : "open -a Terminal",
};

// Desktop-only: the assistant only ever sends a commandId across the wire,
// never this literal command text — that's the actual safety boundary.
const DEV_COMMAND_MAP: Record<string, string> = {
  git_status: "git status",
  git_pull: "git pull",
  npm_install: "npm install",
  npm_test: "npm test",
  npm_build: "npm run build",
};

function runExec(command: string, cwd: string | undefined): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    exec(command, { cwd, timeout: EXEC_TIMEOUT_MS }, (err, stdout, stderr) => {
      const output = `${stdout ?? ""}${stderr ?? ""}`.trim().slice(0, MAX_OUTPUT_CHARS);
      resolve({ ok: !err, output: output || (err ? err.message : "(no output)") });
    });
  });
}

async function launchApp(appName: string): Promise<{ ok: boolean; message: string }> {
  if (appName === "Obsidian") {
    try {
      await shell.openExternal("obsidian://open");
      return { ok: true, message: "Opened Obsidian." };
    } catch (err) {
      return { ok: false, message: `Could not open Obsidian: ${(err as Error).message}` };
    }
  }
  const command = LAUNCH_COMMANDS[appName as LaunchableApp];
  if (!command) return { ok: false, message: `Don't know how to launch "${appName}" yet.` };

  const wrapped = process.platform === "win32" ? `start "" ${command}` : command;
  const { ok, output } = await runExec(wrapped, undefined);
  return ok
    ? { ok: true, message: `Launched ${appName}.` }
    : { ok: false, message: `Could not launch ${appName} — is it installed and on your PATH? (${output})` };
}

/** The one guardrail that actually matters here — nothing from run_shell executes without this. */
async function confirmShellCommand(command: string, projectLabel: string | null): Promise<boolean> {
  const win = BrowserWindow.getAllWindows()[0] ?? null;
  const result = await dialog.showMessageBox(win as unknown as BrowserWindow, {
    type: "warning",
    buttons: ["Run", "Reject"],
    defaultId: 1,
    cancelId: 1,
    title: "Upstream assistant wants to run a command",
    message: `Run this command${projectLabel ? ` in ${projectLabel}` : ""}?`,
    detail: command,
  });
  return result.response === 0;
}

export function startCommandRunner(supabase: SupabaseClient<Database>): () => void {
  let stopped = false;

  async function poll() {
    if (stopped) return;
    try {
      const pending = await getPendingCommands(supabase);
      for (const command of pending) {
        await handleCommand(supabase, command);
      }
    } catch (err) {
      console.error("Command runner poll failed:", err);
    }
  }

  const id = setInterval(poll, POLL_INTERVAL_MS);
  poll();
  return () => {
    stopped = true;
    clearInterval(id);
  };
}

// Fail loudly at startup, not silently at command time, if the desktop map
// ever drifts out of sync with the ids the assistant is allowed to send.
for (const { id: commandId } of DEV_COMMAND_ALLOWLIST) {
  if (!DEV_COMMAND_MAP[commandId]) {
    console.error(`commandRunner: DEV_COMMAND_MAP is missing an entry for allowlisted id "${commandId}"`);
  }
}

async function handleCommand(
  supabase: SupabaseClient<Database>,
  command: { id: string; type: string; payload: Record<string, unknown> }
): Promise<void> {
  try {
    if (command.type === "launch_app") {
      const appName = command.payload.appName as string;
      const { ok, message } = await launchApp(appName);
      await updateCommandStatus(supabase, command.id, { status: ok ? "completed" : "failed", result: message });
      return;
    }

    if (command.type === "run_dev_command") {
      const commandId = command.payload.commandId as string;
      const projectId = command.payload.projectId as string | undefined;
      const commandText = DEV_COMMAND_MAP[commandId];
      if (!commandText) {
        await updateCommandStatus(supabase, command.id, { status: "failed", result: `Unknown command id: ${commandId}` });
        return;
      }
      const projects = await listProjects(supabase);
      const project = projects.find((p) => p.id === projectId);
      if (!project?.localPath) {
        await updateCommandStatus(supabase, command.id, {
          status: "failed",
          result: "That project has no local folder configured.",
        });
        return;
      }
      const { ok, output } = await runExec(commandText, project.localPath);
      await updateCommandStatus(supabase, command.id, {
        status: ok ? "completed" : "failed",
        result: `$ ${commandText}\n${output}`,
      });
      return;
    }

    if (command.type === "run_shell") {
      const shellCommand = command.payload.command as string;
      const projectId = command.payload.projectId as string | null | undefined;
      let cwd: string | undefined;
      let projectLabel: string | null = null;
      if (projectId) {
        const projects = await listProjects(supabase);
        const project = projects.find((p) => p.id === projectId);
        cwd = project?.localPath ?? undefined;
        projectLabel = project?.name ?? null;
      }

      const approved = await confirmShellCommand(shellCommand, projectLabel);
      if (!approved) {
        await updateCommandStatus(supabase, command.id, { status: "rejected" });
        return;
      }

      const { ok, output } = await runExec(shellCommand, cwd);
      await updateCommandStatus(supabase, command.id, {
        status: ok ? "completed" : "failed",
        result: `$ ${shellCommand}\n${output}`,
      });
      return;
    }

    await updateCommandStatus(supabase, command.id, { status: "failed", result: `Unknown command type: ${command.type}` });
  } catch (err) {
    await updateCommandStatus(supabase, command.id, {
      status: "failed",
      result: (err as Error).message,
    }).catch(() => {});
  }
}
