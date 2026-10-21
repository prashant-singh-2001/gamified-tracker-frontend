import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import { useUserId } from '@/lib/auth/useUserId';
import type { ActivityLogResponse } from '@/features/log-activity/types';
import { rangeStart } from './filters';
import type { HistoryFilters, LogPage } from './types';

/** Every log of the current user, unpaged. Home uses it for its recent list and streak names. */
export function useMyLogs() {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.activityLog.byUser(userId ?? 0),
    enabled: userId !== undefined,
    queryFn: async () =>
      (await api.get<ActivityLogResponse[]>(endpoints.activityLog.byUser(userId ?? 0))).data,
  });
}

/** Logs per request on the History screen. */
export const HISTORY_PAGE = 50;

/** History: newest first, `HISTORY_PAGE` at a time, filtered by the server. */
export function useLogPages(filters: HistoryFilters) {
  const userId = useUserId();
  return useInfiniteQuery({
    queryKey: qk.activityLog.pages(userId ?? 0, filters),
    enabled: userId !== undefined,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) =>
      (
        await api.get<LogPage>(endpoints.activityLog.byUser(userId ?? 0), {
          params: {
            page: pageParam,
            size: HISTORY_PAGE,
            sort: 'startTime,desc',
            activityId: filters.activityId ?? undefined,
            from: rangeStart(filters.range),
          },
        })
      ).data,
    getNextPageParam: (last) => (last.page + 1 < last.totalPages ? last.page + 1 : undefined),
  });
}

/** One log, for the detail sheet. */
export function useLog(logId: string | undefined) {
  return useQuery({
    queryKey: qk.activityLog.byId(logId ?? ''),
    enabled: logId !== undefined,
    queryFn: async () =>
      (await api.get<ActivityLogResponse>(endpoints.activityLog.byId(logId ?? ''))).data,
  });
}
