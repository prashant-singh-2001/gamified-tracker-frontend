import type { LevelTracker, Threshold } from './types';

export type LevelProgress = {
  level: number;
  /** XP earned inside the current level. */
  inLevel: number;
  /** XP the current level is worth (the gap to the next threshold); null at the top. */
  bandSize: number | null;
  /** XP still to go to the next level; 0 at the top. */
  toNext: number;
  /** 0-100 through the current level; 100 at the top. */
  percent: number;
  nextLevel: number | null;
};

/**
 * Where someone is in an activity. The tracker's own `xpForNextLevel` and `progressPercent` only
 * know explicit threshold rows (on the default curve they say "0 to go, 100%" at every level), so
 * progress is measured against the effective ladder, which includes the default curve. With no
 * tracker yet it is level 1 at 0%.
 */
export function levelProgress(
  tracker: Pick<LevelTracker, 'level' | 'totalXp' | 'currentLevelXp'> | undefined,
  ladder: readonly Threshold[],
): LevelProgress {
  if (!tracker) {
    const next = ladder.find((t) => t.level === 2);
    return {
      level: 1,
      inLevel: 0,
      bandSize: next
        ? next.xpRequired - (ladder.find((t) => t.level === 1)?.xpRequired ?? 0)
        : null,
      toNext: next ? next.xpRequired - (ladder.find((t) => t.level === 1)?.xpRequired ?? 0) : 0,
      percent: 0,
      nextLevel: next ? 2 : null,
    };
  }
  const { level, totalXp, currentLevelXp } = tracker;
  // The level's own threshold is where it starts; without the row, work back from the tracker.
  const start = ladder.find((t) => t.level === level)?.xpRequired ?? totalXp - currentLevelXp;
  const next = ladder.find((t) => t.level === level + 1);
  if (!next) {
    return {
      level,
      inLevel: totalXp - start,
      bandSize: null,
      toNext: 0,
      percent: 100,
      nextLevel: null,
    };
  }
  const band = next.xpRequired - start;
  const inLevel = Math.max(0, totalXp - start);
  return {
    level,
    inLevel,
    bandSize: band,
    toNext: Math.max(0, next.xpRequired - totalXp),
    percent: band > 0 ? Math.min(100, Math.max(0, (inLevel / band) * 100)) : 100,
    nextLevel: level + 1,
  };
}

export type LadderRow = Threshold & { state: 'past' | 'current' | 'next' };

/** The rows to show: a couple of levels behind, the current one, and the next five. */
export function ladderWindow(ladder: readonly Threshold[], level: number): LadderRow[] {
  return [...ladder]
    .sort((a, b) => a.level - b.level)
    .filter((t) => t.level >= level - 2 && t.level <= level + 5)
    .map((t) => ({
      ...t,
      state: t.level < level ? 'past' : t.level === level ? 'current' : 'next',
    }));
}
