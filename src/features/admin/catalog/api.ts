import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CatalogActivity } from '@/features/activities/types';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import type { CreateActivityBody, PatchActivityBody, RemoveResult } from './catalog';

/** Every activity, deactivated ones included (admin only); the page filters them out itself. */
export function useAdminCatalog() {
  return useQuery({
    queryKey: qk.activities.admin(),
    queryFn: async () =>
      (
        await api.get<CatalogActivity[]>(endpoints.activities.list, {
          params: { includeInactive: true },
        })
      ).data,
  });
}

/** Every catalog change refreshes the admin list, the app's picker and any open detail. */
function useRefreshCatalog() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: qk.activities.all });
}

export function useCreateActivity() {
  const refresh = useRefreshCatalog();
  return useMutation({
    mutationFn: async (body: CreateActivityBody) =>
      (await api.post<CatalogActivity>(endpoints.activities.create, body)).data,
    onSuccess: refresh,
  });
}

export function useUpdateActivity() {
  const refresh = useRefreshCatalog();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: PatchActivityBody }) =>
      (await api.patch<CatalogActivity>(endpoints.activities.byId(id), body)).data,
    onSuccess: refresh,
  });
}

export function useRemoveActivity() {
  const refresh = useRefreshCatalog();
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.delete<RemoveResult>(endpoints.activities.byId(id))).data,
    onSuccess: refresh,
  });
}
