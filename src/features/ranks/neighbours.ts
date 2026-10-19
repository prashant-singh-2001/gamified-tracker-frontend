import type { RankTierMember } from './types';

/**
 * The user's row with up to `radius` people above and below, from a tier board sorted best
 * first. Returns null when the user isn't in the loaded rows (tier larger than the page).
 */
export function neighboursOf(
  rows: readonly RankTierMember[],
  userId: number,
  radius = 5,
): RankTierMember[] | null {
  const index = rows.findIndex((r) => r.userId === userId);
  if (index === -1) return null;
  return rows.slice(Math.max(0, index - radius), index + radius + 1);
}
