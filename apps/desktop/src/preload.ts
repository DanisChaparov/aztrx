import { contextBridge, ipcRenderer } from "electron";

/**
 * Bridge exposed to the web app running inside the Aztrx desktop shell.
 *
 * Most features (sessions, auth, projects, dashboard) go through the web
 * app's existing API routes and Supabase client — no IPC needed. This
 * bridge only exposes what genuinely requires the Electron main process:
 * desktop notifications, local git verification, and monitor sync.
 */
contextBridge.exposeInMainWorld("aztrx", {
  /** True inside the desktop app — lets the web app adjust behavior. */
  isDesktop: true,

  openSignIn: () => ipcRenderer.invoke("open-sign-in"),
  /** Forward the browser-side Supabase session to the main process so
   *  ambientMonitor, chatRunner, TTS, and other background services can
   *  authenticate — they use fileStorageAdapter, not the renderer's cookies. */
  setSession: (accessToken: string, refreshToken: string) =>
    ipcRenderer.invoke("set-session", accessToken, refreshToken),
  getState: () => ipcRenderer.invoke("get-state"),
  startSession: (plannedDurationMin: number) =>
    ipcRenderer.invoke("start-session", plannedDurationMin),
  completeSession: (sessionId: string) =>
    ipcRenderer.invoke("complete-session", sessionId),
  abandonSession: (sessionId: string) =>
    ipcRenderer.invoke("abandon-session", sessionId),
  onStateChanged: (callback: (state: unknown) => void) => {
    ipcRenderer.on("state-changed", (_event, state) => callback(state));
  },
});
