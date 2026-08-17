"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@aztrx/api-client";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { WaterButton } from "@/components/WaterButton";

/** Current local time formatted for datetime-local input min attribute. */
function localNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NewProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [localPath, setLocalPath] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const supabase = getBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      await createProject(supabase, {
        userId: user.id,
        name,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        githubRepoUrl: githubRepoUrl || null,
        localPath: localPath || null,
      });

      setName("");
      setDeadline("");
      setGithubRepoUrl("");
      setLocalPath("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "rounded-[10px] border border-white/10 bg-white/[0.03] px-3 py-2 font-inter text-sm text-white outline-none transition-colors focus:border-[#3B82F6]";

  return (
    <form onSubmit={handleSubmit} className="glass-panel flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1.5">
        <label className="font-manrope text-xs text-neutral-400">Project name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Aztrx API"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-manrope text-xs text-neutral-400">Deadline (optional, date + time)</label>
        <input
          type="datetime-local"
          value={deadline}
          min={localNow()}
          onChange={(e) => setDeadline(e.target.value)}
          className={inputClass}
        />
        {deadline && new Date(deadline) < new Date() && (
          <p className="font-inter text-xs text-red-400">Deadline must be in the future</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-manrope text-xs text-neutral-400">GitHub repo (optional, enables verification)</label>
        <input
          value={githubRepoUrl}
          onChange={(e) => setGithubRepoUrl(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-manrope text-xs text-neutral-400">Local folder (optional)</label>
        <p className="-mt-0.5 font-inter text-xs leading-relaxed text-neutral-500">
          Lets the desktop app run <code className="text-neutral-400">git log</code> here to verify a session
          from commits you haven&apos;t pushed yet. It reads commit timestamps only — never your code, and it
          never writes.
        </p>
        <input
          value={localPath}
          onChange={(e) => setLocalPath(e.target.value)}
          placeholder="C:\Users\you\code\project"
          className={inputClass}
        />
      </div>
      {error && <p className="font-inter text-xs text-red-400">{error}</p>}
      <WaterButton type="submit" disabled={submitting} variant="primary" className="mt-1 self-start">
        {submitting ? "Creating…" : "Create project"}
      </WaterButton>
    </form>
  );
}
