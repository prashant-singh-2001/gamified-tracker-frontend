import type { RankTier } from '@/lib/api/types';

/** Row of `GET /api/ranks/{tier}/leaderboard` and `/api/ranks/me/leaderboard`. */
export type RankTierMember = {
  withinRankPosition: number;
  userId: number;
  totalXp: number;
  overallLevel: number;
  tier: RankTier;
};

/** Row of `GET /api/ranks`. */
export type RankDistribution = {
  tier: RankTier;
  userCount: number;
};

/** Row of `GET /api/leaderboard` (requires `page` and `size`). */
export type LeaderboardEntry = {
  rank: number;
  userId: number;
  totalXp: number;
};
