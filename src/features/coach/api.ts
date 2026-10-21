import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import type { WeeklyInsights } from './types';

/** How long a note is kept before a visit asks the coach again. */
export const NOTE_KEPT_FOR = 30 * 60_000;

/**
 * The week's note and the facts behind it. The server writes a fresh note on every call (and a
 * local model can take seconds), so the app keeps one for half an hour and never refetches it on
 * focus. "Write a new note" is a plain refetch.
 */
export function useWeeklyInsights() {
  return useQuery({
    queryKey: qk.insights.weekly(),
    queryFn: async () => (await api.get<WeeklyInsights>(endpoints.insights.weekly)).data,
    staleTime: NOTE_KEPT_FOR,
    gcTime: NOTE_KEPT_FOR,
    refetchOnWindowFocus: false,
  });
}
