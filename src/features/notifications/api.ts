import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import type { UnreadCount } from './types';

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
