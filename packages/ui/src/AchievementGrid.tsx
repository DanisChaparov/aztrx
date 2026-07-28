"use client";

import { motion } from "framer-motion";
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
  type LucideIcon,
} from "lucide-react";

// Deliberately not the full `Achievement` type from @focus-forge/core — that
// type carries an `isUnlocked` function, and functions can't be passed from
// a Server Component into a Client Component like this one.
export interface AchievementSummary {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const ICONS: Record<string, LucideIcon> = {
  first_session: Sprout,
  streak_3: Flame,
  streak_7: Zap,
  streak_30: Shield,
  sessions_10: TrendingUp,
  sessions_100: Award,
  deep_worker: Waves,
  marathon: Mountain,
  sponsor: Heart,
  patron: Crown,
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
  unlockedIds,
}: {
  achievements: AchievementSummary[];
  unlockedIds: Set<string>;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
      variants={container}
      className="grid grid-cols-5 gap-3"
    >
      {achievements.map((achievement) => {
        const unlocked = unlockedIds.has(achievement.id);
        const Icon = ICONS[achievement.id] ?? Award;
        return (
          <motion.div
            key={achievement.id}
            variants={pop}
            whileHover={unlocked ? { scale: 1.08, y: -2 } : undefined}
            title={`${achievement.name} — ${achievement.description}`}
            className={`glass-panel flex flex-col items-center gap-2 p-3 text-center transition-colors ${
              unlocked ? "border-[#5ed29c]/40" : "opacity-40 grayscale"
            }`}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                unlocked ? "bg-[#5ed29c]/20" : "bg-white/5"
              }`}
            >
              <Icon size={16} className={unlocked ? "text-[#5ed29c]" : "text-neutral-500"} />
            </div>
            <span className="font-manrope text-[10px] leading-tight text-neutral-300">{achievement.name}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
