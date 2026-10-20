import { useMemo } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMyLogs } from '@/features/history/api';
import { CATEGORY_ICON } from '@/lib/utils/category';
import { formatNumber, timeAgo } from '@/lib/utils/format';
import { fromServerDateTime } from '@/lib/utils/serverTime';

const SHOWN = 4;

/** The latest few logs, from the history the page already loads. Held or rejected XP is not shown as earned. */
export function RecentActivity() {
  const logs = useMyLogs();

  const recent = useMemo(
    () =>
      [...(logs.data ?? [])]
        .sort(
          (a, b) =>
            fromServerDateTime(b.endTime).getTime() - fromServerDateTime(a.endTime).getTime(),
        )
        .slice(0, SHOWN),
    [logs.data],
  );

  return (
    <section aria-label="Recent activity" className="flex flex-col gap-3">
      <h3 className="font-display text-2xl leading-none font-extrabold">Recent</h3>
      {logs.isPending ? (
        <div role="status" aria-label="Loading recent activity" className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p className="text-sm text-soft">
          Nothing logged yet. Your latest sessions will show up here.
        </p>
      ) : (
        <ul>
          {recent.map((log) => {
            const Icon = CATEGORY_ICON[log.activity.category];
            const held = log.reviewStatus === 'FLAGGED';
            const none = log.reviewStatus === 'REJECTED';
            return (
              <li
                key={log.id}
                className="flex items-center gap-3 border-b border-line py-2 last:border-0"
              >
                <Icon className="size-4 shrink-0 text-soft" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-[15px]">{log.activity.name}</span>
                <span className="shrink-0 text-xs text-muted">
                  {timeAgo(fromServerDateTime(log.endTime))}
                </span>
                <span
                  className={`w-24 shrink-0 text-right font-mono text-sm font-bold ${held ? 'text-pending' : none ? 'text-muted' : 'text-xp'}`}
                >
                  {held
                    ? `${formatNumber(Math.round(log.xpEarned))} on hold`
                    : none
                      ? '0 XP'
                      : `+${formatNumber(Math.round(log.xpEarned))} XP`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
