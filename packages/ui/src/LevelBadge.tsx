"use client";

import { motion } from "framer-motion";
import type { LevelInfo } from "@focus-forge/core";

export function LevelBadge({ levelInfo }: { levelInfo: LevelInfo }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - levelInfo.progress);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="glass-panel flex items-center gap-3 px-4 py-3"
    >
      <div className="relative h-14 w-14 shrink-0">
        <svg viewBox="0 0 60 60" className="h-14 w-14 -rotate-90">
          <circle cx="30" cy="30" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
          <motion.circle
            cx="30"
            cy="30"
            r={radius}
            fill="none"
            stroke="#60A5FA"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-manrope text-base font-bold text-neutral-100">
          {levelInfo.level}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="font-manrope text-sm font-medium text-neutral-200">Level {levelInfo.level}</span>
        <span className="font-inter text-xs text-neutral-500">
          {levelInfo.xpIntoLevel} / {levelInfo.xpForNextLevel} XP
        </span>
      </div>
    </motion.div>
  );
}
