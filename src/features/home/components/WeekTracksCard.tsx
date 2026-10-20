import { useMemo } from 'react';
import { Link } from 'react-router';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { StreakPill } from '@/components/ui/StreakPill';
import { WeekStrip } from '@/components/ui/WeekStrip';
import { useStreaks } from '@/features/activities/api';
import { isStreakAlive, loggedToday } from '@/features/activities/streaks';
import { useMyLogs } from '@/features/history/api';
import { useWeeklyReport } from '@/features/stats/api';
import { formatXp } from '@/lib/utils/format';

function Change({ value }: { value: number }) {
  if (Math.abs(value) < 0.5) return <span className="text-sm text-muted">no change</span>;
  const up = value > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-sm font-bold ${up ? 'text-accent' : 'text-muted'}`}
    >
      <Icon className="size-4" aria-hidden="true" />
      {Math.round(Math.abs(value))}%
      <span className="sr-only">{up ? ' up' : ' down'} on last week</span>
    </span>
  );
}

/** Seven-day chart that fills the card, with the live streaks as tiles pinned to the bottom. */
export function WeekTracksCard() {
  const report = useWeeklyReport();
  const streaks = useStreaks();
  const logs = useMyLogs();

  // The streak endpoint only knows activity ids; names come from the user's logged activities.
  const names = useMemo(() => {
    const map = new Map<number, string>();
    for (const { activity } of logs.data ?? []) map.set(activity.id, activity.name);
    return map;
  }, [logs.data]);

  if (report.isPending) return <CardSkeleton label="Loading this week" />;
  if (report.isError) {
    return (
      <ErrorPanel
        error={report.error}
        title="Couldn't load this week"
        onRetry={() => void report.refetch()}
      />
    );
  }

  const week = report.data;
  const alive = (streaks.data ?? []).filter((s) => isStreakAlive(s));
  const fresh = week.currentWeekXp === 0 && week.previousWeekXp === 0;

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl leading-none font-extrabold">This week</h2>
          <p className="text-sm text-muted">The last 7 days</p>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-2xl font-bold text-xp">
            {formatXp(week.currentWeekXp)}
          </span>
          {!fresh && <Change value={week.percentageChange} />}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <WeekStrip
          days={fresh ? [] : week.dailyBreakdown}
          fill
          emptyMessage="Log an activity to start your week."
        />
      </div>

      {alive.length > 0 && (
        <ul className="mt-auto flex flex-col border-t border-line pt-2" aria-label="Active streaks">
          {alive.map((s) => {
            const name = names.get(s.activityId);
            return (
              <li
                key={s.activityId}
                className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0"
              >
                <span className="flex items-center gap-3">
                  <StreakPill count={s.currentStreak} />
                  <span className="truncate text-[15px] font-medium">
                    {name ?? `Activity #${s.activityId}`}
                  </span>
                </span>
                {loggedToday(s) ? (
                  <span className="text-sm text-muted">Done for today</span>
                ) : (
                  <Link
                    to={`/app/log${name ? `?activity=${encodeURIComponent(name)}` : ''}`}
                    className="inline-flex min-h-11 items-center text-sm font-medium text-streak no-underline hover:underline"
                  >
                    Log today to keep it
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
