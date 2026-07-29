import { exec } from "node:child_process";

const EXEC_TIMEOUT_MS = 10_000;

/**
 * Real local commits in a project's folder since a given timestamp — a second
 * verification signal alongside the GitHub check in verify-session, for genuine
 * work that was committed locally but not yet pushed during the session window.
 * Returns null (not false) on any error — the same "unknown, not false" pattern
 * the GitHub check already uses, so an unrelated git failure (not a git repo,
 * git not installed, etc.) can't accidentally count against verification.
 */
export function detectLocalActivity(localPath: string, sinceIso: string): Promise<boolean | null> {
  return new Promise((resolve) => {
    // sinceIso comes from the session row (server-generated timestamptz), not
    // user input, so direct interpolation into the shell command is safe here.
    const command = `git log --since="${sinceIso}" --oneline`;
    exec(command, { cwd: localPath, timeout: EXEC_TIMEOUT_MS }, (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      resolve(stdout.trim().length > 0);
    });
  });
}
