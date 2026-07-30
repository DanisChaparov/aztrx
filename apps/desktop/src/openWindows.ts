import { exec } from "node:child_process";

export interface OpenWindow {
  processName: string;
  title: string;
}

/**
 * Every process that currently has a *visible* window, with its title.
 *
 * `MainWindowTitle -ne ''` is the important filter: Steam or Discord minimized
 * to the system tray has no main window title, so a program merely launched at
 * boot is ignored. Only something you actually have open on screen shows up.
 *
 * Windows-only; every other platform gets an empty list, which degrades the
 * caller to focused-window checks rather than erroring.
 */
export function listOpenWindows(): Promise<OpenWindow[]> {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve([]);
      return;
    }
    const command =
      "powershell -NoProfile -Command \"Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | " +
      'Select-Object ProcessName, MainWindowTitle | ConvertTo-Json -Compress"';
    exec(command, { timeout: 5000 }, (err, stdout) => {
      if (err) {
        resolve([]);
        return;
      }
      try {
        // ConvertTo-Json emits a bare object rather than an array when only one
        // process matches — normalize both shapes.
        const parsed = JSON.parse(stdout.trim() || "[]") as
          | { ProcessName: string; MainWindowTitle: string }
          | { ProcessName: string; MainWindowTitle: string }[];
        const list = Array.isArray(parsed) ? parsed : [parsed];
        resolve(
          list
            .filter((entry) => entry?.ProcessName)
            .map((entry) => ({ processName: entry.ProcessName, title: entry.MainWindowTitle ?? "" }))
        );
      } catch {
        resolve([]);
      }
    });
  });
}
