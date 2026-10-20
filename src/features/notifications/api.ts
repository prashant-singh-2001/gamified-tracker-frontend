import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ActivityLogResponse } from '@/features/log-activity/types';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import { fromServerDateTime } from '@/lib/utils/serverTime';
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

const POLL_MS = 1_500;
const GIVE_UP_MS = 15_000;
const CLOCK_SLACK_MS = 2_000;

/** Level-ups for this log's activity that were created once the log had been saved. */
function levelUpsSince(events: LevelUpEvent[] | undefined, log: ActivityLogResponse | undefined) {
  if (!events || !log) return [];
  const since = fromServerDateTime(log.createdAt).getTime() - CLOCK_SLACK_MS;
  return events.filter(
    (e) => e.activityId === log.activity.id && fromServerDateTime(e.createdAt).getTime() >= since,
  );
}

/**
 * Did this log cause a level-up? `leveledUp` on the POST response is always false: XP is applied
 * asynchronously by the gamification service, which then raises a level-up notification. So we
 * poll the feed for a short while after saving and report the old → new level once it appears.
 * Logs that award no XP (pending review, rejected) are never polled.
 */
export function useLevelUpForLog(
  log: ActivityLogResponse | undefined,
): { oldLevel: number; newLevel: number } | null {
  const [startedAt] = useState(() => Date.now());
  const awardsXp = log?.reviewStatus === 'CLEARED' || log?.reviewStatus === 'APPROVED';

  const query = useQuery({
    queryKey: qk.notifications.levelUpFor(log?.id ?? -1),
    enabled: awardsXp,
    queryFn: async () => (await api.get<LevelUpEvent[]>(endpoints.notifications.list)).data,
    refetchInterval: (q) =>
      levelUpsSince(q.state.data, log).length > 0 || Date.now() - startedAt > GIVE_UP_MS
        ? false
        : POLL_MS,
  });

  const hits = levelUpsSince(query.data, log);
  if (hits.length === 0) return null;
  return {
    oldLevel: Math.min(...hits.map((e) => e.oldLevel)),
    newLevel: Math.max(...hits.map((e) => e.newLevel)),
  };
}
