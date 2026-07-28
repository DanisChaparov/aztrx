"use client";

import { motion } from "framer-motion";
import type { HeatmapDay } from "@focus-forge/core";

function intensityClass(day: HeatmapDay): string {
  if (day.verifiedCount === 0) return "bg-white/5";
  if (day.verifiedMinutes < 30) return "bg-[#173a2c]";
  if (day.verifiedMinutes < 60) return "bg-[#1f6b4c]";
  if (day.verifiedMinutes < 120) return "bg-[#2fa876]";
  return "bg-[#5ed29c]";
}

export function Heatmap({ days }: { days: HeatmapDay[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid grid-flow-col gap-1"
      style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
    >
      {days.map((day) => (
        <motion.div
          key={day.date}
          whileHover={{ scale: 1.3 }}
          title={`${day.date}: ${day.verifiedCount} verified session${day.verifiedCount === 1 ? "" : "s"}, ${day.verifiedMinutes} min`}
          className={`h-3 w-3 rounded-sm ${intensityClass(day)}`}
        />
      ))}
    </motion.div>
  );
}
