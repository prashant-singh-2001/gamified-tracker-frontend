import { getTierInfo, RANK_TIERS, type RankCard, type RankTierInfo } from '@/lib/api/types';

/**
 * How far up its tier band a user sits, 0–1. 0 is the lower edge of the tier, 1 the upper edge
 * (about to be promoted). `percentile` is a top fraction (0 = best), so it is inverted.
 */
export function tierProgress(card: Pick<RankCard, 'tier' | 'percentile'>): number {
  const { topFrom, topTo } = getTierInfo(card.tier);
  const span = topTo - topFrom;
  if (span <= 0) return 1;
  const within = Math.min(1, Math.max(0, (card.percentile - topFrom) / span));
  return 1 - within;
}

/** The tier above this one, or null at Summit. */
export function nextTierUp(tier: RankCard['tier']): RankTierInfo | null {
  const { order } = getTierInfo(tier);
  return RANK_TIERS.find((t) => t.order === order + 1) ?? null;
}
