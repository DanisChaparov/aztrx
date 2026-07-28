"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

export function StreakFlame({ streak }: { streak: number }) {
  const isActive = streak > 0;
  const intensity = Math.min(1, streak / 30); // visually maxes out around a 30-day streak
  const scale = 1 + intensity * 0.35;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="glass-panel flex items-center gap-3 px-4 py-3"
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
        {isActive && (
          <div
            className="absolute inset-0 rounded-full blur-md"
            style={{
              backgroundColor: "#5ed29c",
              opacity: 0.3 + intensity * 0.35,
              animation: "ff-streak-pulse 2.2s ease-in-out infinite",
            }}
          />
        )}
        <motion.div
          animate={isActive ? { scale: [scale, scale * 1.08, scale], rotate: [-2, 2, -2] } : { scale: 0.85 }}
          transition={isActive ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : undefined}
          className="relative"
        >
          <Flame
            size={26}
            className={isActive ? "text-[#5ed29c]" : "text-neutral-600"}
            fill={isActive ? "#5ed29c" : "none"}
            fillOpacity={isActive ? 0.25 : 0}
          />
        </motion.div>
      </div>
      <div className="flex flex-col">
        <span className="font-manrope text-lg font-semibold text-neutral-100">
          {streak} day{streak === 1 ? "" : "s"}
        </span>
        <span className="font-inter text-xs text-neutral-500">
          {isActive ? "current streak" : "start a session to begin"}
        </span>
      </div>
      <style>{`
        @keyframes ff-streak-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </motion.div>
  );
}
