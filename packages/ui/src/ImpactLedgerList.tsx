"use client";

import { motion } from "framer-motion";

export interface ImpactLedgerListItem {
  dependencyId: string;
  dependencyName: string;
  totalSimulatedAmount: number;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function ImpactLedgerList({ items }: { items: ImpactLedgerListItem[] }) {
  if (items.length === 0) {
    return (
      <p className="font-inter text-sm text-neutral-500">
        No impact yet — link a GitHub repo on a project and complete a verified session to start funding the
        dependencies it relies on.
      </p>
    );
  }

  const total = items.reduce((sum, item) => sum + item.totalSimulatedAmount, 0);

  return (
    <div className="glass-panel flex flex-col gap-3 p-4">
      <motion.div
        className="font-inter text-sm text-neutral-400"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        Simulated impact so far:{" "}
        <span className="font-manrope font-semibold text-[#8b74ff]">{formatCents(total)}</span>
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
