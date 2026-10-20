import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import { useUserId } from '@/lib/auth/useUserId';
import type { BestTime, CategoryTotal, DailyXp, WeeklyReport } from './types';

/** This week, Monday to Sunday (UTC), with the change versus the same days last week. */
export function useWeeklyReport() {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.analytics.weeklyReport(userId ?? 0),
    enabled: userId !== undefined,
    queryFn: async () =>
      (
        await api.get<WeeklyReport>(endpoints.activityLog.analytics.weeklyReport(userId ?? 0), {
          params: { mode: 'calendar' },
        })
      ).data,
  });
}

/** The last `days` UTC days ending today, zero-filled, oldest first. */
export function useXpOverTime(days: number) {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.analytics.xpOverTime(userId ?? 0, days),
    enabled: userId !== undefined,
    queryFn: async () =>
      (
        await api.get<DailyXp[]>(endpoints.activityLog.analytics.xpOverTime(userId ?? 0), {
          params: { days },
        })
      ).data,
  });
}

/** All-time minutes, XP and sessions per category. */
export function useCategorySummary() {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.analytics.categorySummary(userId ?? 0),
    enabled: userId !== undefined,
    queryFn: async () =>
      (await api.get<CategoryTotal[]>(endpoints.activityLog.analytics.categorySummary(userId ?? 0)))
        .data,
  });
}

/** XP per hour of day (UTC buckets) and the best hour. */
export function useBestTime() {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.analytics.bestTimeOfDay(userId ?? 0),
    enabled: userId !== undefined,
    queryFn: async () =>
      (await api.get<BestTime>(endpoints.activityLog.analytics.bestTimeOfDay(userId ?? 0))).data,
  });
}
