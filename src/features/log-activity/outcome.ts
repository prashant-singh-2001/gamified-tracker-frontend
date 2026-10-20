import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import type { ActivityLogResponse } from './types';

/** `GET /api/activitylog/{id}/outcome`: what applying this log's XP did. */
export type LogOutcome = {
  status: 'APPLIED' | 'PENDING';
  xpApplied: number | null;
  leveledUp: boolean | null;
  /** The activity's level after / before this log (not the overall level). */
  newLevel: number | null;
  previousLevel: number | null;
};

const POLL_MS = 1_500;
const GIVE_UP_MS = 15_000;

/**
 * Did this log cause a level-up? `leveledUp` on the POST response is always false: XP is applied a
 * moment later by the gamification service. This polls the outcome endpoint until it says APPLIED
 * (or 15 s pass) and reports the activity's old and new level. A log held for review or rejected
 * never gets XP, so it is never polled: its outcome would stay PENDING.
 */
export function useLevelUpForLog(
  log: ActivityLogResponse | undefined,
): { oldLevel: number; newLevel: number } | null {
  const [startedAt] = useState(() => Date.now());
  const awardsXp = log?.reviewStatus === 'CLEARED' || log?.reviewStatus === 'APPROVED';

  const query = useQuery({
    queryKey: qk.activityLog.outcome(log?.id ?? -1),
    enabled: awardsXp,
    queryFn: async () =>
      (await api.get<LogOutcome>(endpoints.activityLog.outcome(log?.id ?? -1))).data,
    refetchInterval: (q) =>
      q.state.data?.status === 'APPLIED' || Date.now() - startedAt > GIVE_UP_MS ? false : POLL_MS,
  });

  const outcome = query.data;
  if (
    outcome?.status !== 'APPLIED' ||
    !outcome.leveledUp ||
    outcome.newLevel === null ||
    outcome.previousLevel === null
  ) {
    return null;
  }
  return { oldLevel: outcome.previousLevel, newLevel: outcome.newLevel };
}
