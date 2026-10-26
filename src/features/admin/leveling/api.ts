import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Threshold } from '@/features/activities/types';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';

/** Every explicit threshold row of every activity. An activity with none runs on the default curve. */
export function useAllThresholds() {
  return useQuery({
    queryKey: qk.thresholds.all(),
    queryFn: async () => (await api.get<Threshold[]>(endpoints.thresholds.all)).data,
  });
}

/** A level change touches the ladder everywhere it is shown, so refresh all of it. */
function useRefreshThresholds() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: qk.thresholds.root });
}

/**
 * Reads one level as it is stored right now. The page shows a ladder loaded earlier, so an edit
 * asks again just before it is confirmed. Rejects with a 404 when the level no longer exists.
 */
export function useReadThreshold() {
  return useMutation({
    mutationFn: async (key: Pick<Threshold, 'activityId' | 'level'>) =>
      // The body is only a key, but the backend still validates `xpRequired` as positive (and
      // answers 400 without it), so a placeholder is sent. It is ignored.
      (await api.post<Threshold>(endpoints.thresholds.lookup, { ...key, xpRequired: 1 })).data,
  });
}

/** Creates a level, or replaces the one with the same number. */
export function useSaveThreshold() {
  const refresh = useRefreshThresholds();
  return useMutation({
    mutationFn: async (row: Threshold) =>
      (await api.post<Threshold>(endpoints.thresholds.all, row)).data,
    onSuccess: refresh,
  });
}

/** Changes the XP of a level that exists. */
export function useUpdateThreshold() {
  const refresh = useRefreshThresholds();
  return useMutation({
    mutationFn: async ({ activityId, level, xpRequired }: Threshold) =>
      (await api.put<Threshold>(endpoints.thresholds.row(activityId, level), { xpRequired })).data,
    onSuccess: refresh,
  });
}

export function useDeleteThreshold() {
  const refresh = useRefreshThresholds();
  return useMutation({
    mutationFn: async ({ activityId, level }: Pick<Threshold, 'activityId' | 'level'>) => {
      await api.delete(endpoints.thresholds.row(activityId, level));
    },
    onSuccess: refresh,
  });
}
