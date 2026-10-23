import type { Threshold } from '@/features/activities/types';
import { formatNumber } from '@/lib/utils/format';

const xp = (n: number) => formatNumber(Math.round(n));

/** The ladder in level order. */
export const byLevel = (rows: readonly Threshold[]) => [...rows].sort((a, b) => a.level - b.level);

/**
 * Whether a level can take this XP. `xpRequired` is cumulative and must rise strictly with level,
 * so a level has to need more than the nearest lower level and less than the nearest higher one.
 * The messages match the server's, so a client check and a server `409` read the same.
 * `rows` is the ladder as it stands; the row being replaced (same level) is ignored.
 */
export function checkLevel(
  rows: readonly Threshold[],
  level: number,
  xpRequired: number,
): string | null {
  if (!Number.isInteger(level) || level < 1) return 'Level must be a whole number, 1 or more';
  if (!Number.isFinite(xpRequired) || xpRequired < 0) return 'XP required must be 0 or more';
  if (level > 1 && xpRequired <= 0) return 'XP required must be more than 0';

  const others = byLevel(rows).filter((r) => r.level !== level);
  const lower = [...others].reverse().find((r) => r.level < level);
  const higher = others.find((r) => r.level > level);
  if (lower && xpRequired <= lower.xpRequired) {
    return `Level ${level} must need more XP than level ${lower.level} (${xp(lower.xpRequired)}), but got ${xp(xpRequired)}`;
  }
  if (higher && xpRequired >= higher.xpRequired) {
    return `Level ${level} must need less XP than level ${higher.level} (${xp(higher.xpRequired)}), but got ${xp(xpRequired)}`;
  }
  return null;
}

export type StepRow = Threshold & {
  /** XP this level adds on top of the one before it; null for the first row. */
  step: number | null;
};

/** The ladder with what each level costs on its own, so a jump or a dip stands out. */
export function withSteps(rows: readonly Threshold[]): StepRow[] {
  const sorted = byLevel(rows);
  return sorted.map((row, i) => ({
    ...row,
    step: i === 0 ? null : row.xpRequired - (sorted[i - 1]?.xpRequired ?? 0),
  }));
}

/** An activity's own rows from the list of every threshold. Empty means the default curve. */
export const explicitRows = (all: readonly Threshold[], activityId: number) =>
  byLevel(all.filter((t) => t.activityId === activityId));

/** The ladder as it would be with `level` set to `xpRequired` (an add, an edit or a replace). */
export function withLevel(
  rows: readonly Threshold[],
  level: number,
  xpRequired: number,
): Threshold[] {
  const activityId = rows[0]?.activityId ?? 0;
  return byLevel([...rows.filter((r) => r.level !== level), { activityId, level, xpRequired }]);
}
