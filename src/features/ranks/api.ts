import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import type { RankCard } from '@/lib/api/types';

/** The caller's own rank card. 404 means "no rank yet" (ranks recompute every few minutes). */
export function useMyRank() {
  return useQuery({
    queryKey: qk.ranks.me(),
    queryFn: async () => (await api.get<RankCard>(endpoints.ranks.me)).data,
  });
}
