import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import type { LevelUpEvent, UnreadCount } from './types';

/** Unread level-up count for the bell badge; refreshed whenever the tab regains focus. */
export function useUnreadCount() {
  return useQuery({
    queryKey: qk.notifications.unreadCount(),
    queryFn: async () =>
      (await api.get<UnreadCount>(endpoints.notifications.unreadCount)).data.count,
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });
}

/** Level-ups, newest first; `unreadOnly` is the Unread view. */
export function useNotifications(unreadOnly: boolean) {
  return useQuery({
    queryKey: qk.notifications.list(unreadOnly),
    queryFn: async () =>
      (
        await api.get<LevelUpEvent[]>(endpoints.notifications.list, {
          params: { unreadOnly },
        })
      ).data,
  });
}

/** Marks one read straight away, then settles with the server; the bell count follows. */
export function useMarkRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.post(endpoints.notifications.markRead(id));
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: qk.notifications.all });
      const before = queryClient.getQueriesData<LevelUpEvent[]>({
        queryKey: ['notifications', 'list'],
      });
      for (const [key, rows] of before) {
        if (!rows) continue;
        queryClient.setQueryData<LevelUpEvent[]>(
          key,
          // In the Unread view a read row leaves the list; in All it just loses its dot.
          key[2] === true
            ? rows.filter((n) => n.id !== id)
            : rows.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
      }
      return { before };
    },
    onError: (_err, _id, context) => {
      for (const [key, rows] of context?.before ?? []) queryClient.setQueryData(key, rows);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: qk.notifications.all }),
  });
}

/** Marks every unread notification read in one call; resolves with how many it changed. */
export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (await api.post<{ updated: number }>(endpoints.notifications.readAll)).data.updated,
    onSettled: () => void queryClient.invalidateQueries({ queryKey: qk.notifications.all }),
  });
}
