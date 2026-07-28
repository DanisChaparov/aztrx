import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("focusforge", {
  openSignIn: () => ipcRenderer.invoke("open-sign-in"),
  getState: () => ipcRenderer.invoke("get-state"),
  startSession: (plannedDurationMin: number) => ipcRenderer.invoke("start-session", plannedDurationMin),
  completeSession: (sessionId: string) => ipcRenderer.invoke("complete-session", sessionId),
  abandonSession: (sessionId: string) => ipcRenderer.invoke("abandon-session", sessionId),
  onStateChanged: (callback: (state: unknown) => void) => {
    ipcRenderer.on("state-changed", (_event, state) => callback(state));
  },
});
