import { app, BrowserWindow, ipcMain, Notification, shell } from "electron";
import { join } from "node:path";
import {
  abandonSession,
  getActiveSession,
  listProjects,
  listSessions,
  recordSessionAppUsage,
  startSession,
  verifySession,
} from "@focus-forge/api-client";
import { calculateStreak } from "@focus-forge/core";
import { DesktopActivityMonitor } from "./activityMonitor";
import { startChatRunner } from "./chatRunner";
import { startCommandRunner } from "./commandRunner";
import { startIdleNudge } from "./idleNudge";
import { detectLocalActivity } from "./localVerification";
import { startTtsRunner, warmTtsModel } from "./ttsRunner";
import { createDesktopSupabaseClient } from "./supabaseClient";

const WEB_APP_URL = "http://localhost:3000";
const PROTOCOL = "upstream";

// Without these, an unhandled rejection or sync throw anywhere in the app
// (chat runner, command runner, tts runner) silently kills the entire Electron
// process — no error dialog, no log, just the window disappearing. Log instead
// of dying so failures are diagnosable from the terminal.
process.on("uncaughtException", (err) => {
  console.error("[main] uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[main] unhandledRejection:", reason);
});

const supabase = createDesktopSupabaseClient();
const activityMonitor = new DesktopActivityMonitor(supabase);
let mainWindow: BrowserWindow | null = null;
let monitoringSessionId: string | null = null;

function syncActivityMonitor(sessionId: string | null): void {
  if (sessionId === monitoringSessionId) return;
  monitoringSessionId = sessionId;
  if (sessionId) activityMonitor.start(sessionId);
  else activityMonitor.stop();
}

// Windows/Linux only allow one instance to own the protocol handler; the
// second launch (from clicking an upstream:// link) hands its argv to the first.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const deepLink = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`));
    if (deepLink) handleAuthCallback(deepLink);
    mainWindow?.show();
  });
}

app.on("open-url", (event, url) => {
  event.preventDefault();
  handleAuthCallback(url);
});

async function handleAuthCallback(url: string): Promise<void> {
  try {
    const parsed = new URL(url);
    const accessToken = parsed.searchParams.get("access_token");
    const refreshToken = parsed.searchParams.get("refresh_token");
    if (accessToken && refreshToken) {
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      await pushState();
    }
  } catch (err) {
    console.error("Failed to handle auth callback:", err);
  }
}

async function pushState(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = user ? await getActiveSession(supabase) : null;
  const recentSessions = user ? await listSessions(supabase, { limit: 30 }) : [];
  syncActivityMonitor(session?.id ?? null);
  mainWindow?.webContents.send("state-changed", {
    signedIn: !!user,
    session,
    streak: calculateStreak(recentSessions),
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 380,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(join(__dirname, "..", "public", "index.html"));
  mainWindow.webContents.on("did-finish-load", pushState);
}

app.whenReady().then(() => {
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [join(__dirname, "..")]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }

  createWindow();
  setInterval(pushState, 30_000);
  startCommandRunner(supabase);
  startChatRunner(supabase);
  startTtsRunner(supabase);
  startIdleNudge(supabase);
  warmTtsModel();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  console.log("[main] window-all-closed");
  if (process.platform !== "darwin") app.quit();
});

app.on("render-process-gone", (_event, _webContents, details) => {
  console.error("[main] render process gone:", details);
});

app.on("child-process-gone", (_event, details) => {
  console.error("[main] child process gone:", details);
});

ipcMain.handle("open-sign-in", () => {
  shell.openExternal(`${WEB_APP_URL}/login?desktop=1`);
});

ipcMain.handle("get-state", async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const session = user ? await getActiveSession(supabase) : null;
  const recentSessions = user ? await listSessions(supabase, { limit: 30 }) : [];
  return { signedIn: !!user, session, streak: calculateStreak(recentSessions) };
});

ipcMain.handle("start-session", async (_event, plannedDurationMin: number) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };
  const session = await startSession(supabase, { userId: user.id, projectId: null, plannedDurationMin });
  syncActivityMonitor(session.id);
  return { session };
});

async function checkLocalActivity(sessionId: string): Promise<boolean | null> {
  try {
    const active = await getActiveSession(supabase);
    if (active?.id !== sessionId || !active.projectId) return null;
    const projects = await listProjects(supabase);
    const project = projects.find((p) => p.id === active.projectId);
    if (!project?.localPath) return null;
    return await detectLocalActivity(project.localPath, active.startedAt);
  } catch (err) {
    console.error("Local activity check failed:", err);
    return null;
  }
}

ipcMain.handle("complete-session", async (_event, sessionId: string) => {
  const appUsage = activityMonitor.getAppUsageSnapshot();
  // Checked before verifySession flips the session to "completed" — the
  // active-session lookup inside checkLocalActivity depends on it still
  // being active.
  const localActivityDetected = await checkLocalActivity(sessionId);
  const result = await verifySession(supabase, sessionId, localActivityDetected);
  syncActivityMonitor(null);
  recordSessionAppUsage(supabase, sessionId, appUsage).catch((err) => console.error("Failed to record app usage:", err));
  new Notification({
    title: result.verified ? "Session verified ✓" : "Session completed",
    body: result.verified ? "Your streak just grew." : "Not verified this time — check the dashboard.",
  }).show();
  return result;
});

ipcMain.handle("abandon-session", async (_event, sessionId: string) => {
  const appUsage = activityMonitor.getAppUsageSnapshot();
  await abandonSession(supabase, sessionId);
  syncActivityMonitor(null);
  recordSessionAppUsage(supabase, sessionId, appUsage).catch((err) => console.error("Failed to record app usage:", err));
});
