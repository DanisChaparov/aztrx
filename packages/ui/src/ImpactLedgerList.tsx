"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

export interface ImpactLedgerListItem {
  dependencyId: string;
  dependencyName: string;
  totalSimulatedAmount: number;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ImpactLedgerList({ items }: { items: ImpactLedgerListItem[] }) {
  const [showInfo, setShowInfo] = useState(false);

  if (items.length === 0) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="mb-3 flex items-center gap-1.5 font-inter text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
        >
          <Info size={12} />
          What is this?
        </button>
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="mb-3 rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/[0.04] p-4">
                <p className="font-inter text-sm leading-relaxed text-[#A1A1AA]">
                  When you complete a verified session on a GitHub-linked project, Upstream calculates simulated
                  open-source funding for your project&apos;s dependencies — at <strong className="text-white">2¢ per
                  focused minute</strong>, split evenly across every package in your repo&apos;s{" "}
                  <code className="text-neutral-400">package.json</code>. This is a demo of what real
                  dependency funding would look like. <strong className="text-white">No actual money moves.</strong>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="font-inter text-sm text-neutral-500">
          No impact yet — link a GitHub repo on a project and complete a verified session to start funding the
          dependencies it relies on.
        </p>
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.totalSimulatedAmount, 0);

  return (
    <div className="glass-panel flex flex-col gap-3 p-4">
      {/* Info toggle */}
      <button
        type="button"
        onClick={() => setShowInfo(!showInfo)}
        className="flex items-center gap-1.5 font-inter text-xs text-neutral-500 hover:text-neutral-300 transition-colors self-start"
      >
        <Info size={12} />
        {showInfo ? "Hide explanation" : "What is this?"}
      </button>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/[0.04] p-4">
              <p className="font-inter text-sm leading-relaxed text-[#A1A1AA]">
                When you complete a verified session on a GitHub-linked project, Upstream calculates simulated
                open-source funding for your project&apos;s dependencies — at <strong className="text-white">2¢ per
                focused minute</strong>, split evenly across every package in your repo&apos;s{" "}
                <code className="text-neutral-400">package.json</code>. This is a demo of what real
                dependency funding would look like. <strong className="text-white">No actual money moves.</strong>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="font-inter text-sm text-neutral-400"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        Simulated OSS Impact:{" "}
        <span className="font-manrope font-semibold text-[#60A5FA]">{formatCents(total)}</span>
      </motion.div>
      <ul className="flex flex-col gap-2">
        {items.map((item, index) => (
          <motion.li
            key={item.dependencyId}
            className="flex items-center justify-between font-inter text-sm"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
          >
            <span className="text-neutral-300">{item.dependencyName}</span>
            <span className="tabular-nums text-neutral-500">{formatCents(item.totalSimulatedAmount)}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
