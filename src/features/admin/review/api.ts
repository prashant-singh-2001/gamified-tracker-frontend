import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import type { ActivityLogResponse } from '@/features/log-activity/types';
import type { Decision, ReviewItem } from './types';

/** The flagged sessions waiting for a decision, newest first. Admin only. */
export function useFlaggedQueue() {
  return useQuery({
    queryKey: qk.activityLog.flagged(),
    queryFn: async () => (await api.get<ReviewItem[]>(endpoints.activityLog.flagged)).data,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}

/** How many sessions still wait: items the admin has just decided no longer count. */
export const pendingCount = (items: readonly ReviewItem[] | undefined) =>
  (items ?? []).filter((i) => i.activityLog.reviewStatus === 'FLAGGED').length;

/**
 * Approve or reject one session. The row stays in the list with its new status, so the admin sees
 * the result where they clicked; the next refresh drops it from the queue.
 */
export function useDecide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decision }: { id: number; decision: Decision }) => {
      const url =
        decision === 'approve'
          ? endpoints.activityLog.approve(id)
          : endpoints.activityLog.reject(id);
      return (await api.post<ActivityLogResponse>(url)).data;
    },
    onSuccess: (log) => {
      queryClient.setQueryData<ReviewItem[]>(qk.activityLog.flagged(), (items) =>
        items?.map((i) => (i.activityLog.id === log.id ? { ...i, activityLog: log } : i)),
      );
    },
  });
}
