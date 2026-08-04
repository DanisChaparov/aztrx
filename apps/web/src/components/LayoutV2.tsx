"use client";

import { motion } from "framer-motion";
import { NavV2 } from "@/components/NavV2";

/**
 * V2 authenticated layout — Linear.app / Vercel-inspired.
 * Used when ?theme=v2 or localStorage "upstream-theme" === "v2".
 */
export function LayoutV2({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Ambient glow orbs — fixed background layer */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        {/* Top-center violet glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-violet-500/5 blur-[120px]" />
        {/* Bottom-right emerald glow */}
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] rounded-full bg-emerald-500/4 blur-[100px]" />
        {/* Left cyan glow */}
        <div className="absolute top-1/3 left-0 w-[400px] h-[300px] rounded-full bg-cyan-500/3 blur-[80px]" />
      </div>

      <NavV2 />

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-5xl px-6 pb-24 pt-6"
      >
        {children}
      </motion.main>
    </div>
  );
}
