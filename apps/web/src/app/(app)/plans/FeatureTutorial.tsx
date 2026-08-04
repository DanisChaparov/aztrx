"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, Clock } from "lucide-react";
import { TUTORIALS } from "./tutorials";

interface Props {
  feature: string;
  open: boolean;
  onClose: () => void;
}

export function FeatureTutorial({ feature, open, onClose }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const tutorial = TUTORIALS[feature];

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!tutorial) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Sheet / Modal */}
          <motion.div
            ref={dialogRef}
            className="relative z-10 w-full max-w-lg rounded-t-2xl bg-[#0e0f14] p-6 shadow-2xl sm:rounded-2xl border border-white/10 sm:border-white/10"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 35 }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-neutral-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Content */}
            <div className="flex flex-col gap-5 pr-4">
              {/* Header */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Info size={18} className="text-[#60A5FA]" />
                  <h2 className="font-manrope text-lg font-semibold text-white">{feature}</h2>
                </div>
                {tutorial.status === "coming-soon" && (
                  <span className="self-start rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 font-manrope text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Coming soon
                  </span>
                )}
              </div>

              {/* What it is */}
              <div>
                <h3 className="mb-1.5 font-manrope text-xs font-medium uppercase tracking-wider text-neutral-500">
                  What it is
                </h3>
                <p className="font-inter text-sm leading-relaxed text-[#A1A1AA]">{tutorial.what}</p>
              </div>

              {/* How to use */}
              {tutorial.status === "live" && tutorial.how && (
                <div>
                  <h3 className="mb-1.5 font-manrope text-xs font-medium uppercase tracking-wider text-neutral-500">
                    How to use it
                  </h3>
                  <ol className="flex flex-col gap-2">
                    {tutorial.how.split("\n").filter(Boolean).map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3B82F6]/15 font-manrope text-[10px] font-bold text-[#60A5FA]">
                          {i + 1}
                        </span>
                        <span className="font-inter text-sm text-[#A1A1AA]">{step.replace(/^\d+\.\s*/, "")}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {tutorial.status === "coming-soon" && (
                <div className="flex items-center gap-2 rounded-xl border border-amber-400/15 bg-amber-400/[0.03] p-3">
                  <Clock size={14} className="shrink-0 text-amber-400" />
                  <p className="font-inter text-sm text-amber-400/80">This feature is planned but not yet built. Stay tuned.</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
