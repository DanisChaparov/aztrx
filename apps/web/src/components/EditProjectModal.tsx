"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Save } from "lucide-react";
import type { Project } from "@focus-forge/core";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

/**
 * Modal for editing a project's name, deadline, GitHub URL, and local path.
 * Saves directly to Supabase and refreshes the page on success.
 */
export function EditProjectModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [deadline, setDeadline] = useState(
    project.deadline ? project.deadline.slice(0, 16) : ""
  );
  const [githubRepoUrl, setGithubRepoUrl] = useState(project.githubRepoUrl || "");
  const [localPath, setLocalPath] = useState(project.localPath || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");

    const supabase = getBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        name: name.trim(),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        github_repo_url: githubRepoUrl.trim() || null,
        local_path: localPath.trim() || null,
      })
      .eq("id", project.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onClose();
    router.refresh();
  }

  const inputClass =
    "rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 font-inter text-sm text-white outline-none transition-colors focus:border-[#3B82F6] w-full";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0e0f14] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-manrope text-base font-semibold text-white">Edit project</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-manrope text-xs text-neutral-400">Project name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-manrope text-xs text-neutral-400">Deadline</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-manrope text-xs text-neutral-400">GitHub repo URL</label>
            <input
              value={githubRepoUrl}
              onChange={(e) => setGithubRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-manrope text-xs text-neutral-400">Local folder path</label>
            <input
              value={localPath}
              onChange={(e) => setLocalPath(e.target.value)}
              placeholder="C:\dev\my-project"
              className={inputClass}
            />
          </div>

          {error && (
            <p className="font-inter text-xs text-red-400 bg-red-400/5 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] px-5 py-2.5 font-manrope text-sm font-semibold text-white transition-colors hover:bg-[#3B82F6]/90 disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
