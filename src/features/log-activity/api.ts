import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import type {
  ActivityLogRequest,
  ActivityLogResponse,
  NaturalLogDraftResponse,
  NaturalLogRequest,
} from './types';

/** `POST /api/activitylog/natural` — turns a sentence into a draft. Saves nothing. */
export function useNaturalDraft() {
  return useMutation({
    mutationFn: async (body: NaturalLogRequest) =>
      (await api.post<NaturalLogDraftResponse>(endpoints.activityLog.natural, body)).data,
  });
}

/** `POST /api/activitylog/` — the only call that actually saves a log and awards XP. */
export function useLogActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: ActivityLogRequest) =>
      (await api.post<ActivityLogResponse>(endpoints.activityLog.create, body)).data,
    onSuccess: (log) => {
      // The POST response is the only one that knows `leveledUp` and the fresh streak, so the
      // Result screen reads it from the cache. `byId` is deliberately NOT invalidated: a refetch
      // via GET /activitylog/{id} would overwrite it with a version that lacks those fields.
      queryClient.setQueryData(qk.activityLog.byId(log.id), log);
      for (const queryKey of [
        qk.ranks.all,
        qk.activityLog.allByUser(),
        qk.activityLog.allStreaks(),
        qk.analytics.all,
        qk.levels.allPrefix,
        qk.notifications.all,
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
  });
}

/**
 * One log by id. Seeded from the POST response; on a fresh page load it falls back to
 * `GET /api/activitylog/{id}` (whose `leveledUp` / streak fields are not meaningful then).
 */
export function useLog(logId: string | undefined) {
  // Route params are strings but the POST response is cached under its numeric id; TanStack
  // Query hashes "12" and 12 differently, so normalise or the seeded response is never found.
  const id = Number(logId);
  const valid = logId !== undefined && Number.isInteger(id);
  return useQuery({
    queryKey: qk.activityLog.byId(valid ? id : -1),
    enabled: valid,
    queryFn: async () => (await api.get<ActivityLogResponse>(endpoints.activityLog.byId(id))).data,
  });
}
