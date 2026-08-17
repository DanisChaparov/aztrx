"use client";

import { motion } from "framer-motion";
import type { HeatmapDay } from "@aztrx/core";

function intensityClass(day: HeatmapDay): string {
  if (day.verifiedCount === 0) return "bg-white/5";
  if (day.verifiedMinutes < 30) return "bg-[#241c52]";
  if (day.verifiedMinutes < 60) return "bg-[#3a2a9c]";
  if (day.verifiedMinutes < 120) return "bg-[#5236d6]";
  return "bg-[#3B82F6]";
}

const cell = {
  hidden: { opacity: 0, scale: 0 },
  show: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, delay: i * 0.003, ease: "easeOut" },
  }),
};

export function Heatmap({ days }: { days: HeatmapDay[] }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      className="grid grid-flow-col gap-1"
      style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
    >
      {days.map((day, i) => (
        <motion.div
          key={day.date}
          variants={cell}
          custom={i}
          whileHover={{ scale: 1.3, transition: { duration: 0.1 } }}
          title={`${day.date}: ${day.verifiedCount} verified session${day.verifiedCount === 1 ? "" : "s"}, ${day.verifiedMinutes} min`}
          className={`h-3 w-3 rounded-sm ${intensityClass(day)}`}
        />
      ))}
    </motion.div>
  );
}
