"use client";

import { useState } from "react";
import { CheckCircle2, CircleDashed, XCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { FocusSession } from "@aztrx/core";
import { SESSION_TAGS } from "@aztrx/core";
import { CommitList, type CommitListItem } from "./CommitList";
import { ToolUsageList, type ToolUsageItem } from "./ToolUsageList";

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
  tools = [],
}: {
  session: FocusSession;
  projectName?: string;
  commits?: CommitListItem[];
  tools?: ToolUsageItem[];
}) {
  const startedAt = new Date(session.startedAt);
  const StatusIcon = STATUS_ICON[session.status];
  const [showTools, setShowTools] = useState(false);
  const hasTools = tools.length > 0;

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
              <StatusIcon size={16} className="shrink-0 text-[#60A5FA]" />
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
              session.verified ? "bg-[#3B82F6]/20 text-[#93C5FD]" : "bg-white/5 text-neutral-400"
            }`}
          >
            {session.verified ? "Verified" : "Unverified"}
          </motion.span>
        )}
      </div>
      {commits.length > 0 && <CommitList commits={commits} />}

      {/* Session notes */}
      {session.notes && (
        <p className="font-inter text-sm leading-relaxed text-[#A1A1AA] border-l-2 border-[#3B82F6]/30 pl-3 italic">
          {session.notes}
        </p>
      )}

      {/* Session tags */}
      {session.tags && session.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {session.tags.map((tag) => {
            const def = SESSION_TAGS.find((t) => t.value === tag);
            return (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 font-inter text-[10px] text-neutral-500"
              >
                {def?.emoji} {def?.label ?? tag}
              </span>
            );
          })}
        </div>
      )}

      {/* Per-session tool usage */}
      {hasTools && (
        <div>
          <button
            type="button"
            onClick={() => setShowTools(!showTools)}
            className="flex items-center gap-1.5 font-inter text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <motion.span
              animate={{ rotate: showTools ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={12} />
            </motion.span>
            {showTools ? "Hide tools" : `Tools used (${tools.length})`}
          </button>
          <AnimatePresence>
            {showTools && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-2">
                  <ToolUsageList items={tools} compact />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
