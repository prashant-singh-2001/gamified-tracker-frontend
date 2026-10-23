import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import { useUserId } from '@/lib/auth/useUserId';
import type { CatalogActivity, LevelTracker, RecentActivityPick, Streak, Threshold } from './types';

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

/**
 * One activity by id or by name (the backend takes either in the same place). A 404 means unknown
 * or deactivated, which reads the same to a user. An admin may also open a deactivated one.
 */
export function useActivity(idOrName: number | string, includeInactive = false) {
  return useQuery({
    queryKey: qk.activities.byId(idOrName, includeInactive),
    queryFn: async () =>
      (
        await api.get<CatalogActivity>(
          endpoints.activities.byId(encodeURIComponent(String(idOrName))),
          { params: includeInactive ? { includeInactive: true } : undefined },
        )
      ).data,
    retry: false,
  });
}

/** The caller's level in every activity they have logged. */
export function useMyLevels() {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.levels.byUser(userId ?? 0),
    enabled: userId !== undefined,
    queryFn: async () => (await api.get<LevelTracker[]>(endpoints.levels.byUser(userId ?? 0))).data,
  });
}

/** The effective level ladder up to `upToLevel`: explicit rows if there are any, else the default curve. */
export function useLadder(activityId: number, upToLevel: number) {
  return useQuery({
    queryKey: [...qk.thresholds.byActivity(activityId), upToLevel] as const,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      (
        await api.get<Threshold[]>(endpoints.thresholds.byActivity(activityId), {
          params: { upToLevel },
        })
      ).data,
  });
}
