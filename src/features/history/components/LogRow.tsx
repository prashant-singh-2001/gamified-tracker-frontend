import { Link } from 'react-router';
import { StatusPill } from '@/components/ui/StatusPill';
import type { ActivityLogResponse } from '@/features/log-activity/types';
import { cn } from '@/lib/utils/cn';
import { CATEGORY_ICON } from '@/lib/utils/category';
import { formatDuration, formatTimeRange } from '@/lib/utils/format';
import { formatLocalRange, fromServerDateTime } from '@/lib/utils/serverTime';
import { xpText } from '../xpText';

/** One log in a day: what, when, how long, and what it earned. Opens its detail. */
export function LogRow({
  log,
  search,
  showDate = false,
}: {
  log: ActivityLogResponse;
  search: string;
  /** Add the day to the time, for lists that are not grouped under a day. */
  showDate?: boolean;
}) {
  const Icon = CATEGORY_ICON[log.activity.category];
  const xp = xpText(log);

  return (
    <Link
      to={`/app/history/${log.id}${search}`}
      className="flex min-h-14 items-center gap-3 rounded-xl py-2 pr-2 pl-1 no-underline hover:bg-surface-2"
    >
      <Icon className="size-5 shrink-0 text-soft" aria-hidden="true" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate font-medium">{log.activity.name}</span>
          {log.reviewStatus !== 'CLEARED' && <StatusPill status={log.reviewStatus} />}
        </span>
        <span className="text-sm text-muted">
          {showDate
            ? formatTimeRange(fromServerDateTime(log.startTime), fromServerDateTime(log.endTime))
            : formatLocalRange(log.startTime, log.endTime)}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          {formatDuration(log.durationMinutes)}
        </span>
      </span>
      <span className={cn('shrink-0 text-right font-mono text-[15px] font-bold', xp.className)}>
        {xp.text}
      </span>
    </Link>
  );
}
