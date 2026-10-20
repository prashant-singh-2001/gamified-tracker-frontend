import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import { useUserId } from '@/lib/auth/useUserId';
import type { WeeklyReport } from './types';

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
