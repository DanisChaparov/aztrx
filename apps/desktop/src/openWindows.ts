import { execFile } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface OpenWindow {
  processName: string;
  title: string;
}

/**
 * Enumerates every visible top-level window and the process that owns it.
 *
 * This uses the Win32 EnumWindows API rather than PowerShell's much simpler
 * `Get-Process | ... MainWindowTitle`, and the difference matters: MainWindowTitle
 * reports one window *per process*, so a browser with five windows open exposes
 * exactly one title — whichever Windows considers "main". Measured on a real
 * machine with YouTube playing in a second Chrome window, Get-Process showed
 * only the other window and missed it completely. EnumWindows returns both.
 *
 * The script is written to a temp file and run by path instead of being passed
 * as a command string: it contains embedded C# full of quotes and braces, and
 * handing that to a shell to re-parse is how it breaks.
 *
 * Windows-only. Every other platform gets an empty list, degrading callers to
 * focused-window checks rather than erroring.
 */
const SCRIPT = `
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8
Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public class UpstreamWindows {
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumProc cb, IntPtr p);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] static extern int GetWindowTextW(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] static extern int GetWindowTextLength(IntPtr h);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  delegate bool EnumProc(IntPtr h, IntPtr p);
  public static List<string> List() {
    var r = new List<string>();
    EnumWindows((h, p) => {
      if (!IsWindowVisible(h)) return true;
      int len = GetWindowTextLength(h);
      if (len == 0) return true;
      var sb = new StringBuilder(len + 1);
      GetWindowTextW(h, sb, sb.Capacity);
      uint pid; GetWindowThreadProcessId(h, out pid);
      r.Add(pid + "|" + sb.ToString());
      return true;
    }, IntPtr.Zero);
    return r;
  }
}
"@
$byPid = @{}
Get-Process | ForEach-Object { $byPid[[uint32]$_.Id] = $_.ProcessName }
[UpstreamWindows]::List() | ForEach-Object {
  $parts = $_.Split('|', 2)
  [PSCustomObject]@{ ProcessName = $byPid[[uint32]$parts[0]]; Title = $parts[1] }
} | Where-Object { $_.ProcessName } | ConvertTo-Json -Compress
`;

export function listOpenWindows(): Promise<OpenWindow[]> {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      resolve([]);
      return;
    }

    const dir = mkdtempSync(join(tmpdir(), "upstream-windows-"));
    const scriptPath = join(dir, "list-windows.ps1");
    const cleanup = () => {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // A leftover temp file is not worth failing a poll over.
      }
    };

    try {
      writeFileSync(scriptPath, SCRIPT, "utf8");
    } catch {
      cleanup();
      resolve([]);
      return;
    }

    execFile(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath],
      { timeout: 8000, encoding: "utf8", windowsHide: true },
      (err, stdout) => {
        cleanup();
        if (err) {
          resolve([]);
          return;
        }
        try {
          // ConvertTo-Json emits a bare object rather than an array when only
          // one window matches — normalize both shapes.
          const parsed = JSON.parse(stdout.trim() || "[]") as
            | { ProcessName: string; Title: string }
            | { ProcessName: string; Title: string }[];
          const list = Array.isArray(parsed) ? parsed : [parsed];
          resolve(
            list
              .filter((entry) => entry?.ProcessName)
              .map((entry) => ({ processName: entry.ProcessName, title: entry.Title ?? "" }))
          );
        } catch {
          resolve([]);
        }
      }
    );
  });
}
