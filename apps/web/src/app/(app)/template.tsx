"use client";

import { motion } from "framer-motion";

// Next.js remounts `template.tsx` on every navigation within this segment
// (unlike `layout.tsx`, which persists) — that's what makes it fire an enter
// animation per page while the Nav above stays put.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
