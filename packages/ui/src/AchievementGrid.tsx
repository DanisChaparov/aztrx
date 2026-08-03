"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Crown,
  Flame,
  Heart,
  Mountain,
  Shield,
  Sprout,
  TrendingUp,
  Waves,
  Zap,
  Target,
  Sun,
  Moon,
  MessageCircle,
  Sparkles,
  Crosshair,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import type { AchievementProgress } from "@focus-forge/core";

export interface AchievementSummary {
  id: string;
  name: string;
  description: string;
  /** Emoji from core — fallback when no Lucide icon is mapped. */
  icon: string;
  unlocked: boolean;
  progress: AchievementProgress | null;
  hint: string;
}

const ICONS: Record<string, LucideIcon> = {
  first_session: Sprout,
  streak_3: Flame,
  streak_7: Zap,
  streak_30: Shield,
  sessions_10: TrendingUp,
  sessions_100: Award,
  deep_worker: Waves,
  deep_dive: Target,
  marathon: Mountain,
  sponsor: Heart,
  patron: Crown,
  morning_person: Sun,
  night_owl: Moon,
  polyglot: MessageCircle,
  comeback: Sparkles,
  resurrector: Crosshair,
  public_twin: BookOpen,
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const pop = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 20 } },
};

export function AchievementGrid({
  achievements,
}: {
  achievements: AchievementSummary[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? achievements.find((a) => a.id === selectedId) : null;

  return (
    <>
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        variants={container}
        className="grid grid-cols-5 gap-3"
      >
        {achievements.map((achievement) => {
          const { unlocked, progress } = achievement;
          const Icon = ICONS[achievement.id] ?? Award;

          return (
            <motion.div
              key={achievement.id}
              variants={pop}
              whileHover={{ scale: 1.08, y: -2 }}
              onClick={() => setSelectedId(selectedId === achievement.id ? null : achievement.id)}
              title={unlocked ? achievement.description : `${achievement.name} — click for details`}
              className={`glass-panel flex cursor-pointer flex-col items-center gap-1.5 p-3 text-center transition-colors ${
                unlocked ? "border-[#6744FF]/40" : "opacity-50 grayscale hover:opacity-70"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  unlocked ? "bg-[#6744FF]/20" : "bg-white/5"
                }`}
              >
                <Icon size={16} className={unlocked ? "text-[#8b74ff]" : "text-neutral-500"} />
              </div>
              <span className="font-manrope text-[10px] leading-tight text-neutral-300">
                {achievement.name}
              </span>

              {/* Progress bar for locked achievements with partial progress */}
              {!unlocked && progress?.target != null && (
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(100, ((progress.current ?? 0) / progress.target) * 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="h-full rounded-full bg-[#6744FF]/40"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Detail popover */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-xl border border-white/10 bg-[#0e0f14] p-4">
              <div className="flex items-start gap-3">
                {(() => {
                  const Icon = ICONS[selected.id] ?? Award;
                  return (
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        selected.unlocked ? "bg-[#6744FF]/20" : "bg-white/5"
                      }`}
                    >
                      <Icon size={18} className={selected.unlocked ? "text-[#8b74ff]" : "text-neutral-500"} />
                    </div>
                  );
                })()}
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <h4 className="font-manrope text-sm font-medium text-white">{selected.name}</h4>
                    {selected.unlocked ? (
                      <span className="font-inter text-[11px] text-[#8b74ff]">Unlocked</span>
                    ) : (
                      <span className="font-inter text-[11px] text-neutral-500">Locked</span>
                    )}
                  </div>
                  <p className="font-inter text-sm text-[#A1A1AA]">{selected.description}</p>

                  {!selected.unlocked && selected.progress?.target != null && (
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-[#6744FF]/50 transition-all"
                          style={{
                            width: `${Math.min(100, ((selected.progress.current ?? 0) / selected.progress.target) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="shrink-0 font-mono text-[11px] text-neutral-400">
                        {selected.progress.current ?? 0}/{selected.progress.target}{" "}
                        {selected.progress.unit ?? ""}
                      </span>
                    </div>
                  )}

                  {!selected.unlocked && (
                    <p className="mt-1 font-inter text-[13px] leading-relaxed text-neutral-400">
                      💡 {selected.hint}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
