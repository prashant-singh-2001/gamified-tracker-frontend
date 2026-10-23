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
