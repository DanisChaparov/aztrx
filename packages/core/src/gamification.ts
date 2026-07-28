import type { FocusSession } from "./types";

/** 1 XP per verified focus-minute — ties progress directly to real, honest work. */
export function calculateXp(sessions: FocusSession[]): number {
  return sessions.filter((s) => s.verified).reduce((sum, s) => sum + s.plannedDurationMin, 0);
}

export interface LevelInfo {
  level: number;
  xp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number; // 0..1
}

/** Cumulative XP required to REACH a given level (triangular growth — early levels come fast, later ones slow down). */
function cumulativeXpForLevel(level: number): number {
  return 50 * level * (level + 1);
}

export function getLevelInfo(xp: number): LevelInfo {
  let level = 1;
  while (cumulativeXpForLevel(level) <= xp) level += 1;

  const currentLevelFloor = level === 1 ? 0 : cumulativeXpForLevel(level - 1);
  const nextLevelCeiling = cumulativeXpForLevel(level);
  const xpIntoLevel = xp - currentLevelFloor;
  const xpForNextLevel = nextLevelCeiling - currentLevelFloor;

  return {
    level,
    xp,
    xpIntoLevel,
    xpForNextLevel,
    progress: xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 0,
  };
}
