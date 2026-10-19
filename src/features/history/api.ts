import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import { useUserId } from '@/lib/auth/useUserId';
import type { ActivityLogResponse } from '@/features/log-activity/types';

/** Every log of the current user. The endpoint has no paging yet, so this loads all of them. */
export function useMyLogs() {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.activityLog.byUser(userId ?? 0),
    enabled: userId !== undefined,
    queryFn: async () =>
      (await api.get<ActivityLogResponse[]>(endpoints.activityLog.byUser(userId ?? 0))).data,
  });
}
