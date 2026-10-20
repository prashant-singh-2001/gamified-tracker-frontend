import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { isNotFound } from '@/lib/api/errors';
import { qk } from '@/lib/api/queryKeys';
import type { RankCard, RankTier } from '@/lib/api/types';
import type { RankDistribution, RankTierMember } from './types';

/**
 * The caller's own rank card, or null while they are not ranked yet (ranks recompute every few
 * minutes). Opts in to `200 {"ranked": false}`; a 404 from an older backend reads the same way.
 */
export function useMyRank() {
  return useQuery({
    queryKey: qk.ranks.me(),
    queryFn: async (): Promise<RankCard | null> => {
      try {
        const { data } = await api.get<RankCard | { ranked: false }>(endpoints.ranks.me, {
          params: { allowUnranked: true },
        });
        return 'tier' in data ? data : null;
      } catch (err) {
        if (isNotFound(err)) return null;
        throw err;
      }
    },
  });
}

/** Members of the caller's own tier. Only enable once a rank exists (it 404s otherwise). */
export function useMyTierBoard(enabled: boolean) {
  return useQuery({
    queryKey: qk.ranks.myBoard(),
    enabled,
    queryFn: async () =>
      (
        await api.get<RankTierMember[]>(endpoints.ranks.myLeaderboard, {
          params: { page: 0, size: 100 },
        })
      ).data,
  });
}

/** Top `size` members of any tier, best first. */
export function useTierBoard(tier: RankTier, size: number) {
  return useQuery({
    queryKey: qk.ranks.tier(tier, size),
    queryFn: async () =>
      (
        await api.get<RankTierMember[]>(endpoints.ranks.tierLeaderboard(tier), {
          params: { page: 0, size },
        })
      ).data,
  });
}

/** How many users sit in each tier (`GET /api/ranks`). */
export function useRankDistribution() {
  return useQuery({
    queryKey: qk.ranks.ladder(),
    queryFn: async () => (await api.get<RankDistribution[]>(endpoints.ranks.all)).data,
    staleTime: 60_000,
  });
}
