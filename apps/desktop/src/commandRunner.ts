// cross-spawn, not node:child_process directly — same reasoning as
// chatRunner.ts's claude CLI invocation: routing an arbitrary (often
// AI-generated) command string through cmd.exe's shell re-parsing is fragile
// once it contains nested quotes or shell-meaningful characters (a stray `<`
// in HTML content read as a redirect operator broke a real run_shell command
// tonight). Commands are written to a temp .ps1 file and executed by path —
// PowerShell reads the file's raw text directly, no shell string re-parsing
// in between.
import spawn from "cross-spawn";
import { exec } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  // The script-file approach below is Windows/PowerShell-specific — other
  // platforms don't have the exact cmd.exe re-quoting fragility that broke a
  // real command tonight, so they keep the simpler original behavior.
  if (process.platform !== "win32") {
    return new Promise((resolve) => {
      exec(command, { cwd, timeout: EXEC_TIMEOUT_MS }, (err, stdout, stderr) => {
        const output = `${stdout ?? ""}${stderr ?? ""}`.trim().slice(0, MAX_OUTPUT_CHARS);
        resolve({ ok: !err, output: output || (err ? err.message : "(no output)") });
      });
    });
  }

  return new Promise((resolve) => {
    let scriptDir: string;
    let scriptPath: string;
    try {
      scriptDir = mkdtempSync(join(tmpdir(), "upstream-cmd-"));
      scriptPath = join(scriptDir, "run.ps1");
      writeFileSync(scriptPath, command, "utf-8");
    } catch (err) {
      resolve({ ok: false, output: `Failed to prepare command: ${(err as Error).message}` });
      return;
    }

    const cleanup = () => {
      try {
        rmSync(scriptDir, { recursive: true, force: true });
      } catch {
        // best effort — a leftover temp file isn't worth failing the command over
      }
    };

    let child;
    try {
      child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath], {
        cwd,
        timeout: EXEC_TIMEOUT_MS,
      });
    } catch (err) {
      cleanup();
      resolve({ ok: false, output: `Failed to spawn PowerShell: ${(err as Error).message}` });
      return;
    }

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => (stdout += chunk));
    child.stderr?.on("data", (chunk) => (stderr += chunk));
    child.on("error", (err) => {
      cleanup();
      resolve({ ok: false, output: err.message });
    });
    child.on("close", (code) => {
      cleanup();
      const output = `${stdout}${stderr}`.trim().slice(0, MAX_OUTPUT_CHARS);
      resolve({ ok: code === 0, output: output || (code !== 0 ? `exited with code ${code}` : "(no output)") });
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

  // runExec now runs commands as a PowerShell script file on Windows, not a
  // cmd.exe string — `start ""` was cmd.exe-specific syntax and isn't valid
  // there; PowerShell's own Start-Process launches it detached instead.
  const wrapped = process.platform === "win32" ? `Start-Process ${command}` : command;
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

/** Same per-action confirmation guardrail as run_shell — a click could land
 *  anywhere, so typing is scoped to "whatever's currently focused" (something
 *  the user themselves put in focus) and always shown before it happens. */
async function confirmTypeText(textToType: string, windowTitle: string | null): Promise<boolean> {
  const win = BrowserWindow.getAllWindows()[0] ?? null;
  const result = await dialog.showMessageBox(win as unknown as BrowserWindow, {
    type: "warning",
    buttons: ["Type it", "Reject"],
    defaultId: 1,
    cancelId: 1,
    title: "Upstream assistant wants to type on your keyboard",
    message: `Type this into ${windowTitle ? `"${windowTitle}"` : "whatever window is currently focused"}?`,
    detail: textToType,
  });
  return result.response === 0;
}

// SendKeys treats + ^ % ~ ( ) { } [ ] as special — each must be individually
// wrapped in braces to be typed literally instead of interpreted.
function escapeForSendKeys(input: string): string {
  return input.replace(/[+^%~(){}[\]]/g, (c) => `{${c}}`);
}

// The escaped text above is embedded in a PowerShell single-quoted string
// literal — those only need an embedded ' doubled, nothing else.
function toPowerShellSingleQuotedLiteral(input: string): string {
  return input.replace(/'/g, "''");
}

export function startCommandRunner(supabase: SupabaseClient<Database>): () => void {
  let stopped = false;
  // A run_shell command sits at "pending" status for as long as its
  // confirmation dialog is open (status only changes once the user answers
  // it) — without this, every 1s poll tick in the meantime would pick the
  // same still-pending row back up and pop yet another dialog for it.
  const inFlight = new Set<string>();

  async function poll() {
    if (stopped) return;
    try {
      const pending = await getPendingCommands(supabase);
      for (const command of pending) {
        if (inFlight.has(command.id)) continue;
        inFlight.add(command.id);
        console.log(`[commandRunner] picked up ${command.id} (${command.type})`);
        handleCommand(supabase, command)
          .then(() => console.log(`[commandRunner] ${command.id} done`))
          .catch((err) => console.error(`[commandRunner] ${command.id} crashed unexpectedly:`, err))
          .finally(() => inFlight.delete(command.id));
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

    if (command.type === "type_text") {
      const textToType = command.payload.text as string;
      // Pure-ESM package — dynamic import() from this CJS-bundled process,
      // same reason as apps/desktop/src/activityMonitor.ts.
      const { activeWindow } = await import("active-win");
      const focused = await activeWindow();
      const windowTitle = focused?.title ?? null;

      const approved = await confirmTypeText(textToType, windowTitle);
      if (!approved) {
        await updateCommandStatus(supabase, command.id, { status: "rejected" });
        return;
      }

      if (process.platform !== "win32") {
        await updateCommandStatus(supabase, command.id, {
          status: "failed",
          result: "Typing simulation is only implemented on Windows right now.",
        });
        return;
      }

      const literal = toPowerShellSingleQuotedLiteral(escapeForSendKeys(textToType));
      const script =
        "Add-Type -AssemblyName System.Windows.Forms\r\n" +
        "Start-Sleep -Milliseconds 300\r\n" +
        `[System.Windows.Forms.SendKeys]::SendWait('${literal}')\r\n`;

      const { ok, output } = await runExec(script, undefined);
      await updateCommandStatus(supabase, command.id, {
        status: ok ? "completed" : "failed",
        result: ok ? `Typed into ${windowTitle ?? "the focused window"}.` : output,
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
