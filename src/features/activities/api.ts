import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import { useUserId } from '@/lib/auth/useUserId';
import type { CatalogActivity, RecentActivityPick, Streak } from './types';

export function useCatalog() {
  return useQuery({
    queryKey: qk.activities.list(),
    queryFn: async () => (await api.get<CatalogActivity[]>(endpoints.activities.list)).data,
    staleTime: 5 * 60_000,
  });
}

/** One row per activity the user has logged. `currentStreak` is only updated when logging. */
export function useStreaks() {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.activityLog.streaks(userId ?? 0),
    enabled: userId !== undefined,
    queryFn: async () => (await api.get<Streak[]>(endpoints.activityLog.streaks(userId ?? 0))).data,
  });
}

/** The caller's most-logged active activities, most logged first (quick picks). */
export function useRecentActivities(limit: number) {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.activityLog.recent(userId ?? 0, limit),
    enabled: userId !== undefined,
    queryFn: async () =>
      (
        await api.get<RecentActivityPick[]>(endpoints.activityLog.recent(userId ?? 0), {
          params: { limit },
        })
      ).data,
  });
}
