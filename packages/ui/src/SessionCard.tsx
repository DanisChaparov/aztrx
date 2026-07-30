"use client";

import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import { motion } from "framer-motion";
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
    <motion.div
      className="glass-panel flex flex-col gap-3 px-4 py-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {session.status === "active" ? (
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <StatusIcon size={16} className="shrink-0 text-[#8b74ff]" />
            </motion.div>
          ) : (
            <StatusIcon size={16} className="shrink-0 text-neutral-500" />
          )}
          <div>
            <div className="font-manrope text-sm font-medium text-neutral-100">{projectName ?? "No project"}</div>
            <div className="font-inter text-xs text-neutral-500">
              {startedAt.toLocaleDateString()} · {session.plannedDurationMin} min · {STATUS_LABEL[session.status]}
            </div>
          </div>
        </div>
        {session.status === "completed" && (
          <motion.span
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={`rounded-full px-2.5 py-1 font-manrope text-xs font-medium ${
              session.verified ? "bg-[#6744FF]/20 text-[#a996ff]" : "bg-white/5 text-neutral-400"
            }`}
          >
            {session.verified ? "Verified" : "Unverified"}
          </motion.span>
        )}
      </div>
      {commits.length > 0 && <CommitList commits={commits} />}
    </motion.div>
  );
}
