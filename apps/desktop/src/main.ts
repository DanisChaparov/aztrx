import { app, BrowserWindow, ipcMain, Menu, Notification, shell, Tray } from "electron";
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
import { AmbientMonitor } from "./ambientMonitor";
import { DesktopActivityMonitor } from "./activityMonitor";
import { startChatRunner } from "./chatRunner";
import { startIdleNudge } from "./idleNudge";
import { startSessionEndWatcher } from "./sessionEndWatcher";
import { detectLocalActivity } from "./localVerification";
import { startTtsRunner, warmTtsModel } from "./ttsRunner";
import { createDesktopSupabaseClient } from "./supabaseClient";

// In development, load from the local Next.js dev server.
// In production (packaged app), load from the deployed URL.
const WEB_APP_URL = app.isPackaged
  ? "https://stt-opal.vercel.app"
  : "http://localhost:3000";
const PROTOCOL = "upstream";

// ── error resilience ──────────────────────────────────────────────────────

process.on("uncaughtException", (err) => {
  console.error("[main] uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[main] unhandledRejection:", reason);
});

// ── state ─────────────────────────────────────────────────────────────────

const supabase = createDesktopSupabaseClient();
const activityMonitor = new DesktopActivityMonitor(supabase);
const ambientMonitor = new AmbientMonitor(supabase);
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let monitoringSessionId: string | null = null;
let isQuitting = false;
let currentStreak = 0;
let sessionRemainingMin: number | null = null;
let isSignedIn = false;

// ── activity monitor sync ─────────────────────────────────────────────────

function syncActivityMonitor(sessionId: string | null): void {
  if (sessionId === monitoringSessionId) return;

  const endedSessionId = monitoringSessionId;
  if (endedSessionId) {
    const appUsage = activityMonitor.getAppUsageSnapshot();
    if (Object.keys(appUsage).length > 0) {
      recordSessionAppUsage(supabase, endedSessionId, appUsage).catch((err) =>
        console.error("Failed to record app usage:", err)
      );
    }
  }

  monitoringSessionId = sessionId;
  if (sessionId) activityMonitor.start(sessionId);
  else activityMonitor.stop();

  ambientMonitor.setActiveSession(sessionId);
}

// ── state push ────────────────────────────────────────────────────────────

async function pushState(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  isSignedIn = !!user;
  const session = user ? await getActiveSession(supabase) : null;
  const recentSessions = user ? await listSessions(supabase, { limit: 30 }) : [];
  syncActivityMonitor(session?.id ?? null);
  currentStreak = calculateStreak(recentSessions);

  sessionRemainingMin = session
    ? Math.max(0, Math.ceil(
        (new Date(session.startedAt).getTime() + session.plannedDurationMin * 60_000 - Date.now()) / 60_000
      ))
    : null;

  updateTray();
}

// ── tray ──────────────────────────────────────────────────────────────────

function updateTray(): void {
  if (!tray) return;
  if (!isSignedIn) {
    tray.setToolTip("Upstream — sign in from the app");
    return;
  }
  const parts: string[] = [];
  if (sessionRemainingMin !== null) {
    parts.push(`${sessionRemainingMin}m left`);
  }
  if (currentStreak > 0) {
    parts.push(`${currentStreak} day streak`);
  }
  tray.setToolTip(parts.length > 0 ? `Upstream — ${parts.join(" · ")}` : "Upstream");
}

function createTrayIcon(): Tray {
  // Minimal 16x16 tray icon drawn as a filled circle — the Upstream brand mark.
  const { nativeImage } = require("electron");
  const icon = nativeImage.createEmpty();
  // Use a simple colored square; on most platforms the tray renders this small.
  // A proper .ico file should replace this for production.
  const img = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAIRJREFUWEftlcENwjAQBPcVSAdIB9AB0AF0AHQA/FMClEAL0AF0AF+N5BhHCRxngweRfDmtdz27OjIZk4mNscgCKvQHULQBbYBHW4hv4O+9owUoFPoDqHMDbdtuPc9nKeVyGIYrEV0AMBH5NhERfN/vL6X8KKWOiD4RuQE4j+P4MBMr3B3bAL9fvQq+28HzizYmwM97AAAAAElFTkSuQmCC"
  );
  const t = new Tray(img);
  t.setToolTip("Upstream");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Upstream",
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  t.setContextMenu(contextMenu);
  t.on("click", () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });
  return t;
}

// ── window ────────────────────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "Upstream",
    backgroundColor: "#0b0c10",
    show: false, // show after ready-to-show to avoid white flash
    webPreferences: {
      preload: join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the full web app — the dashboard, projects, session runner, AI
  // assistant, plans, reports — everything lives in the Next.js app.
  mainWindow.loadURL(WEB_APP_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("close", (event) => {
    if (isQuitting) return;
    // Close → hide to tray. The background services keep running.
    event.preventDefault();
    mainWindow?.hide();
  });

  mainWindow.on("page-title-updated", (event) => {
    event.preventDefault(); // keep "Upstream" as the window title
  });

  // Open external links (GitHub OAuth, docs, etc.) in the default browser,
  // not inside the Electron window where they'd break the app shell.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

// ── single instance + protocol ────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const deepLink = argv.find((arg) => arg.startsWith(`${PROTOCOL}://`));
    if (deepLink) handleAuthCallback(deepLink);
    mainWindow?.show();
    mainWindow?.focus();
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

// ── IPC ───────────────────────────────────────────────────────────────────

ipcMain.handle("open-sign-in", () => {
  shell.openExternal(`${WEB_APP_URL}/login?desktop=1`);
});

ipcMain.handle("get-state", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const session = user ? await getActiveSession(supabase) : null;
  const recentSessions = user ? await listSessions(supabase, { limit: 30 }) : [];
  return { signedIn: !!user, session, streak: calculateStreak(recentSessions) };
});

ipcMain.handle("start-session", async (_event, plannedDurationMin: number) => {
  const { data: { user } } = await supabase.auth.getUser();
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
  const localActivityDetected = await checkLocalActivity(sessionId);
  const result = await verifySession(supabase, sessionId, localActivityDetected);
  syncActivityMonitor(null);
  new Notification({
    title: result.verified ? "Session verified ✓" : "Session completed",
    body: result.verified ? "Your streak just grew." : "Not verified this time — check the dashboard.",
  }).show();
  return result;
});

ipcMain.handle("abandon-session", async (_event, sessionId: string) => {
  await abandonSession(supabase, sessionId);
  syncActivityMonitor(null);
});

// ── app lifecycle ─────────────────────────────────────────────────────────

app.whenReady().then(() => {
  // Remove the default Electron menu bar (File, Edit, View, Window, Help) —
  // this is a single-window app, not a document editor. All navigation is
  // in-app via the Next.js shell.
  Menu.setApplicationMenu(null);

  // Protocol handler registration.
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [join(__dirname, "..")]);
    }
  } else {
    app.setAsDefaultProtocolClient(PROTOCOL);
  }

  createWindow();
  tray = createTrayIcon();

  // State polling — keeps the tray tooltip and background monitors in sync.
  setInterval(pushState, 8_000);

  // Background services.
  ambientMonitor.start();
  startChatRunner(supabase);
  startTtsRunner(supabase);
  startIdleNudge(supabase);
  startSessionEndWatcher(supabase);
  warmTtsModel();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else mainWindow?.show();
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  ambientMonitor.stop();
});

app.on("window-all-closed", () => {
  // Don't quit — background services keep running, tray keeps living.
});

app.on("render-process-gone", (_event, _webContents, details) => {
  console.error("[main] render process gone:", details);
});

app.on("child-process-gone", (_event, details) => {
  console.error("[main] child process gone:", details);
});
