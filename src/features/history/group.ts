import type { ActivityLogResponse } from '@/features/log-activity/types';
import { fromServerDateTime } from '@/lib/utils/serverTime';

export type DayGroup = {
  /** Local calendar day, `YYYY-MM-DD`. */
  key: string;
  /** "Today", "Yesterday" or "Mon, Oct 19". */
  label: string;
  /** XP that counted: cleared and approved logs. Held and rejected logs add nothing. */
  xp: number;
  logs: ActivityLogResponse[];
};

const pad = (n: number) => String(n).padStart(2, '0');
const localKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function labelFor(day: Date, now: Date): string {
  const today = localKey(now);
  const yesterday = localKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const key = localKey(day);
  if (key === today) return 'Today';
  if (key === yesterday) return 'Yesterday';
  return day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const counts = (log: ActivityLogResponse) =>
  log.reviewStatus === 'CLEARED' || log.reviewStatus === 'APPROVED';

/**
 * Groups logs (newest first) by the viewer's local day of their start time. The API buckets by UTC
 * day, but a person's "Tuesday" is their own, so a late-evening log in India stays on its day.
 * A day that continues onto the next page keeps one group, because groups are built from all the
 * rows loaded so far.
 */
export function groupByDay(
  logs: readonly ActivityLogResponse[],
  now: Date = new Date(),
): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const log of logs) {
    const start = fromServerDateTime(log.startTime);
    const key = localKey(start);
    let group = groups.get(key);
    if (!group) {
      group = { key, label: labelFor(start, now), xp: 0, logs: [] };
      groups.set(key, group);
    }
    group.logs.push(log);
    if (counts(log)) group.xp += log.xpEarned;
  }
  return [...groups.values()];
}
