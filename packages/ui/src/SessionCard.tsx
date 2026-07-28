import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import type { FocusSession } from "@focus-forge/core";
import { CommitList, type CommitListItem } from "./CommitList";

const STATUS_LABEL: Record<FocusSession["status"], string> = {
  active: "In progress",
  completed: "Completed",
  broken: "Abandoned",
};

const STATUS_ICON: Record<FocusSession["status"], typeof CheckCircle2> = {
  active: CircleDashed,
  completed: CheckCircle2,
  broken: XCircle,
};

export function SessionCard({
  session,
  projectName,
  commits = [],
}: {
  session: FocusSession;
  projectName?: string;
  commits?: CommitListItem[];
}) {
  const startedAt = new Date(session.startedAt);
  const StatusIcon = STATUS_ICON[session.status];

  return (
    <div className="glass-panel flex flex-col gap-3 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon size={16} className="shrink-0 text-neutral-500" />
          <div>
            <div className="font-manrope text-sm font-medium text-neutral-100">{projectName ?? "No project"}</div>
            <div className="font-inter text-xs text-neutral-500">
              {startedAt.toLocaleDateString()} · {session.plannedDurationMin} min · {STATUS_LABEL[session.status]}
            </div>
          </div>
        </div>
        {session.status === "completed" && (
          <span
            className={`rounded-full px-2.5 py-1 font-manrope text-xs font-medium ${
              session.verified ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-neutral-400"
            }`}
          >
            {session.verified ? "Verified" : "Unverified"}
          </span>
        )}
      </div>
      {commits.length > 0 && <CommitList commits={commits} />}
    </div>
  );
}
