// cross-spawn instead of node:child_process's spawn — on Windows, spawning a
// .cmd shim (like npm-installed `claude`) via node's own shell:true reconstructs
// a single cmd.exe command-line string, which has long-standing, well-documented
// escaping bugs once you combine several long, comma/space-heavy arguments (our
// mcp-config path, allowedTools list, system prompt, and the actual chat prompt
// all at once). cross-spawn is the standard fix (used internally by npm/yarn)
// and handles Windows .cmd resolution + quoting correctly without shell:true.
import spawn from "cross-spawn";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { app } from "electron";
import { getPendingChats, updateChatStatus, type ChatTurn, type Database } from "@aztrx/api-client";
import type { SupabaseClient } from "@supabase/supabase-js";

const POLL_INTERVAL_MS = 5000;
// Was 1000ms (1s) — hammering Supabase every second for a service whose
// round-trip takes 30-90s is unnecessary. 5s keeps latency reasonable
// (user won't notice an extra 4s when the total is 30s+) while cutting
// Supabase polling traffic by 5×.
// A real request round-trips through a freshly-spawned MCP server subprocess
// (stdio handshake + tool discovery) plus however many Supabase-backed tool
// calls the model decides to make — a two-tool question measured well over
// 45s in practice. 45s was too tight and caused real, otherwise-correct
// requests to be killed and reported as failures.
const CLAUDE_TIMEOUT_MS = 90_000;

const TOOL_NAMES = [
  "get_active_session",
  "get_current_activity",
  "get_dashboard_stats",
  "list_projects",
  "start_focus_session",
  "end_focus_session",
  "abandon_focus_session",
  "update_project",
  "get_session_history",
  "get_recent_commits",
  "get_tool_usage",
  "get_profile",
  "get_daily_screen_time",
];
const ALLOWED_TOOLS = TOOL_NAMES.map((name) => `mcp__aztrx__${name}`).join(",");

const SYSTEM_PROMPT =
  "You are Aztrx AI, the assistant built into Aztrx — an app that verifies developers' focus sessions " +
  "against real GitHub commit activity and funds the open-source dependencies they use. You have real " +
  "awareness of the user's computer: which apps/IDEs are open right now, what's focused, and historical usage " +
  "patterns — you're not a generic chatbot, you actually know what's happening on their machine. Be concise " +
  "and friendly, and sound like you're speaking (this may be read aloud) — short, natural sentences over lists. " +
  "The user's message may contain several things at once (a greeting plus a real question, or several " +
  "questions back to back) — you MUST address every part of it, never just the first or easiest part. " +
  "If any part of the message asks what's happening right now on the computer — what's focused, what apps are " +
  "open, what Cursor/Claude/an IDE is doing at this exact moment — you MUST call get_current_activity, not " +
  "get_tool_usage (that one is historical totals only, not real-time). If any part asks about the user's " +
  "streak, stats, sessions, projects, historical tool usage, recent commits/what they've been working on " +
  "over time, or whether a focus session is currently running, you MUST call the matching tool " +
  "(get_dashboard_stats, get_session_history, list_projects, get_tool_usage, get_recent_commits, " +
  "get_active_session) to get the real data before answering that part — never guess, estimate, or skip it, " +
  "even if the rest of the message is small talk. A message can require calling more than one tool — call " +
  "every tool needed to answer every part before writing your final reply. Before calling start_focus_session, " +
  "check get_active_session first so you don't try to start one that's already running. Only call " +
  "start_focus_session, end_focus_session, or abandon_focus_session when the user " +
  "clearly asks for that specific action. You can read what's happening on the computer and start or stop " +
  "focus sessions, but you cannot act on the machine itself — you can't open apps, run commands, type, or " +
  "click. If the user asks for any of that, say plainly that Aztrx doesn't do it, rather than pretending " +
  "or promising it later.";

function ensureMcpConfig(): string {
  const configPath = join(app.getPath("userData"), "mcp-config.json");
  const mcpServerPath = join(__dirname, "mcpServer.js");
  const config = {
    mcpServers: {
      aztrx: {
        type: "stdio",
        command: process.execPath,
        args: [mcpServerPath],
        env: {
          AZTRX_SUPABASE_URL: process.env.SUPABASE_URL ?? "",
          AZTRX_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "",
          AZTRX_USERDATA_DIR: app.getPath("userData"),
          // `command` below is process.execPath, which inside an Electron main
          // process is the path to electron.exe, not a plain node binary.
          // Without this, spawning it tries to boot a second full Electron app
          // (Chromium, GPU process, its own cache dir) instead of just running
          // mcpServer.js as a script — which was silently failing to connect.
          ELECTRON_RUN_AS_NODE: "1",
        },
      },
    },
  };
  // Regenerated on every startup rather than reused across app versions —
  // mcpServer.js's absolute path can change between installs/builds.
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  return configPath;
}

// Measured live: resuming a session instead of starting fresh cut a real
// request's wall time by ~40% and its cache_creation_input_tokens from ~11.8k
// to ~55 — the system prompt + tool definitions no longer get rebuilt from
// scratch on every single message. One session id, global to this desktop
// app instance (matches the single-signed-in-user model mcp-config.json
// already assumes).
function sessionFilePath(): string {
  return join(app.getPath("userData"), "claude-session.json");
}

function loadSessionId(): string | null {
  try {
    const raw = readFileSync(sessionFilePath(), "utf-8");
    const parsed = JSON.parse(raw) as { sessionId?: string };
    return parsed.sessionId ?? null;
  } catch {
    return null;
  }
}

function saveSessionId(sessionId: string): void {
  try {
    writeFileSync(sessionFilePath(), JSON.stringify({ sessionId }), "utf-8");
  } catch (err) {
    console.error("[chatRunner] failed to persist session id:", err);
  }
}

function clearSessionId(): void {
  try {
    writeFileSync(sessionFilePath(), JSON.stringify({ sessionId: null }), "utf-8");
  } catch {
    // best effort — worst case the next call tries to resume a stale id and
    // falls back to fresh again via the same retry path.
  }
}

function formatPrompt(message: string, history: ChatTurn[]): string {
  if (history.length === 0) return message;
  // Joined without literal newlines on purpose — this string is passed as a single
  // argv element through cmd.exe (shell: true on Windows), and embedded newlines
  // inside a quoted shell argument are unreliable across cmd.exe's quoting rules.
  const transcript = history
    .map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`)
    .join(" || ");
  return `Here is the conversation so far (turns separated by " || "): ${transcript} || New message from the user: ${message}`;
}

function runClaude(
  prompt: string,
  mcpConfigPath: string,
  resumeSessionId: string | null
): Promise<{ ok: boolean; text: string; sessionId: string | null }> {
  return new Promise((resolve) => {
    // Explicitly excluded (not just unset) — its presence would make the CLI
    // bill against a paid API key instead of the user's existing Claude Code
    // subscription login, which is the entire point of this path.
    const { ANTHROPIC_API_KEY: _unused, ...envWithoutApiKey } = process.env;

    const args = [
      "-p",
      prompt,
      "--mcp-config",
      mcpConfigPath,
      "--allowedTools",
      ALLOWED_TOOLS,
      "--append-system-prompt",
      SYSTEM_PROMPT,
      "--output-format",
      "json",
    ];
    if (resumeSessionId) args.push("--resume", resumeSessionId);

    // spawn() can throw synchronously (Windows shell:true argument-escaping edge
    // cases, ENAMETOOLONG, etc). This executor only has `resolve`, not `reject` —
    // an uncaught throw here becomes an unhandled promise rejection with no
    // handler anywhere up the chain, which crashes the whole Electron process
    // silently. Must be caught and resolved like any other failure mode.
    let child;
    try {
      child = spawn(
        "claude",
        args,
        // stdin explicitly closed ("ignore") — left open (the default), the CLI
        // spends a few real seconds checking for possible piped input before
        // giving up and proceeding, which is pure wasted latency for a `-p`
        // call that never has anything piped into it.
        { env: envWithoutApiKey, stdio: ["ignore", "pipe", "pipe"] }
      );
    } catch (err) {
      resolve({ ok: false, text: `Failed to spawn the Claude CLI: ${(err as Error).message}`, sessionId: null });
      return;
    }

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      resolve({ ok: false, text: "The assistant took too long to respond and was stopped.", sessionId: null });
    }, CLAUDE_TIMEOUT_MS);

    child.stdout?.on("data", (chunk) => (stdout += chunk));
    child.stderr?.on("data", (chunk) => (stderr += chunk));

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        text: `Couldn't start the Claude CLI (${err.message}) — is it installed and on your PATH?`,
        sessionId: null,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      // MCP servers commonly print connection/init warnings to stderr even on a
      // successful (exit 0) run — surfacing it here is how we'd spot "the aztrx
      // MCP server failed to start" instead of the CLI just quietly answering
      // without tool access.
      if (stderr.trim()) console.warn("[chatRunner] claude stderr:", stderr.trim().slice(0, 1000));
      if (code !== 0) {
        // A --resume against a session the CLI no longer has (pruned, deleted,
        // corrupted) is expected to show up as a non-zero exit here — the
        // caller falls back to a fresh session rather than getting stuck
        // permanently failing on a dead session id.
        resolve({ ok: false, text: stderr.trim() || `claude exited with code ${code}.`, sessionId: null });
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as {
          result?: string;
          session_id?: string;
          messages?: { content?: { type?: string; name?: string }[] }[];
        };
        const toolCalls = (parsed.messages ?? [])
          .flatMap((m) => m.content ?? [])
          .filter((c) => c.type === "tool_use")
          .map((c) => c.name);
        console.log(`[chatRunner] tool calls made: ${toolCalls.length ? toolCalls.join(", ") : "none"}`);
        resolve({ ok: true, text: parsed.result?.trim() || "…", sessionId: parsed.session_id ?? null });
      } catch {
        resolve({ ok: true, text: stdout.trim() || "…", sessionId: null });
      }
    });
  });
}

export function startChatRunner(supabase: SupabaseClient<Database>): () => void {
  let stopped = false;
  const inFlight = new Set<string>();
  const mcpConfigPath = ensureMcpConfig();

  async function poll() {
    if (stopped) return;
    try {
      const pending = await getPendingChats(supabase);
      for (const chat of pending) {
        if (inFlight.has(chat.id)) continue;
        inFlight.add(chat.id);
        handleChat(chat.id, chat.message, chat.history)
          .catch((err) => console.error(`[chatRunner] ${chat.id} crashed unexpectedly:`, err))
          .finally(() => inFlight.delete(chat.id));
      }
    } catch (err) {
      console.error("Chat runner poll failed:", err);
    }
  }

  async function handleChat(chatId: string, message: string, history: ChatTurn[]) {
    console.log(`[chatRunner] picked up ${chatId}: "${message}" — spawning claude...`);

    const resumeSessionId = loadSessionId();
    // A resumed session already has the full conversation server-side —
    // manually re-joining history into the prompt would just duplicate it.
    // That reconstruction only matters for a genuinely fresh session.
    const prompt = resumeSessionId ? message : formatPrompt(message, history);
    console.log(`[chatRunner] resolved prompt (${prompt.length} chars)${resumeSessionId ? " [resuming]" : " [fresh]"}: "${prompt.slice(0, 120)}"`);

    let { ok, text, sessionId } = await runClaude(prompt, mcpConfigPath, resumeSessionId);

    // --resume against a session the CLI can no longer find fails outright
    // rather than silently starting fresh — retry once as a brand-new
    // session (with the full manually-reconstructed history) instead of
    // permanently failing every message until someone notices.
    if (!ok && resumeSessionId) {
      console.warn(`[chatRunner] resume failed for ${chatId}, retrying as a fresh session`);
      clearSessionId();
      const retryPrompt = formatPrompt(message, history);
      ({ ok, text, sessionId } = await runClaude(retryPrompt, mcpConfigPath, null));
    }

    if (ok && sessionId) saveSessionId(sessionId);
    console.log(`[chatRunner] ${chatId} ${ok ? "completed" : "failed"}: ${text.slice(0, 200)}`);
    await updateChatStatus(supabase, chatId, { status: ok ? "completed" : "failed", reply: text }).catch((err) =>
      console.error(`[chatRunner] failed to write result for ${chatId}:`, err)
    );
  }

  const id = setInterval(poll, POLL_INTERVAL_MS);
  poll();
  return () => {
    stopped = true;
    clearInterval(id);
  };
}
