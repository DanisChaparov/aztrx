"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Trash2 } from "lucide-react";
import { archiveProject, deleteProject } from "@focus-forge/api-client";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export function ArchiveButton({
  projectId,
  projectName,
  action,
}: {
  projectId: string;
  projectName: string;
  action: "archive" | "delete";
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function execute() {
    setBusy(true);
    try {
      const supabase = getBrowserSupabaseClient();
      if (action === "archive") await archiveProject(supabase, projectId);
      else await deleteProject(supabase, projectId);
      router.refresh();
    } catch (err) {
      console.error(`Failed to ${action} project:`, err);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-400"
        title={action === "archive" ? `Archive "${projectName}"` : `Delete "${projectName}"`}
      >
        {action === "archive" ? <Archive size={14} /> : <Trash2 size={14} />}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="font-inter text-[11px] text-neutral-500">
        {action === "archive" ? "Archive?" : "Delete?"}
      </span>
      <button
        type="button"
        onClick={execute}
        disabled={busy}
        className="rounded-md bg-red-400/10 px-2 py-0.5 font-inter text-[11px] text-red-400 transition-colors hover:bg-red-400/20 disabled:opacity-50"
      >
        {busy ? "…" : "Yes"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-md px-2 py-0.5 font-inter text-[11px] text-neutral-500 hover:text-white"
      >
        No
      </button>
    </div>
  );
}
