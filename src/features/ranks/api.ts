import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { isNotFound } from '@/lib/api/errors';
import { qk } from '@/lib/api/queryKeys';
import type { RankCard, RankTier } from '@/lib/api/types';
import type { LeaderboardEntry, RankDistribution, RankTierMember } from './types';

/** Ranks recompute about every 30 seconds, so the live screens refetch on that beat and on focus. */
export const LIVE = { refetchInterval: 30_000, refetchOnWindowFocus: true } as const;

/**
 * The caller's own rank card, or null while they are not ranked yet (ranks recompute every few
 * minutes). Opts in to `200 {"ranked": false}`; a 404 from an older backend reads the same way.
 */
export function useMyRank() {
  return useQuery({
    queryKey: qk.ranks.me(),
    ...LIVE,
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
    ...LIVE,
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
    ...LIVE,
    queryFn: async () => (await api.get<RankDistribution[]>(endpoints.ranks.all)).data,
  });
}

/** Rows loaded per request on the full boards. */
export const BOARD_PAGE = 50;

/** One tier's full board, `BOARD_PAGE` rows at a time. Another page exists while the last was full. */
export function useTierBoardPages(tier: RankTier) {
  return useInfiniteQuery({
    queryKey: qk.ranks.tierPages(tier),
    ...LIVE,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      (
        await api.get<RankTierMember[]>(endpoints.ranks.tierLeaderboard(tier), {
          params: { page: pageParam, size: BOARD_PAGE },
        })
      ).data,
    getNextPageParam: (last, pages) => (last.length === BOARD_PAGE ? pages.length : undefined),
  });
}

/** The overall board, or one activity's, `BOARD_PAGE` rows at a time. */
export function useGlobalBoard(activityId: number | null) {
  return useInfiniteQuery({
    queryKey: qk.leaderboard.global(activityId),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      (
        await api.get<LeaderboardEntry[]>(
          activityId === null
            ? endpoints.leaderboard.global
            : endpoints.leaderboard.byActivity(activityId),
          { params: { page: pageParam, size: BOARD_PAGE } },
        )
      ).data,
    getNextPageParam: (last, pages) => (last.length === BOARD_PAGE ? pages.length : undefined),
  });
}

/** The caller's own overall position (a bare number; there is none per activity). */
export function useMyGlobalRank() {
  return useQuery({
    queryKey: qk.leaderboard.me(),
    queryFn: async () => (await api.get<number>(endpoints.leaderboard.me)).data,
  });
}
