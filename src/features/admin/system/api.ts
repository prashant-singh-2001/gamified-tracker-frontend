import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LevelTracker } from '@/features/activities/types';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';

/** Recalculates every user's tier now, and answers with how many users it ranked. */
export function useRecomputeRanks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (await api.post<{ rankedUsers: number }>(endpoints.ranks.recompute)).data.rankedUsers,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.ranks.all }),
  });
}

/** Every user's level in every activity, or in one activity. Admin only. */
export function useAllLevels(activityId: number | null) {
  return useQuery({
    queryKey: activityId === null ? qk.levels.all() : qk.levels.byActivity(activityId),
    queryFn: async () =>
      (
        await api.get<LevelTracker[]>(
          activityId === null ? endpoints.levels.all : endpoints.levels.byActivity(activityId),
        )
      ).data,
  });
}

/**
 * One level tracker by its internal id (the caller's own, or a 404). Nothing the API returns
 * carries a tracker's id yet, so no screen can ask for one; this is here for when it does.
 */
export function useLevelRow(id: number | null) {
  return useQuery({
    queryKey: qk.levels.byId(id ?? 0),
    enabled: id !== null,
    queryFn: async () => (await api.get<LevelTracker>(endpoints.levels.byId(id ?? 0))).data,
    retry: false,
  });
}

export type AwardRequest = {
  /** Omitted to award the acting admin's own account. */
  targetUserId?: number;
  activityId: number;
  xp: number;
};

/** A manual award; the answer is the tracker after it, with whether it crossed a level. */
export function useAwardXp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: AwardRequest) =>
      (await api.post<LevelTracker>(endpoints.levels.all, body)).data,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: qk.levels.allPrefix }),
  });
}
