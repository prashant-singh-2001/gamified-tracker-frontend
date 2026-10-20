import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { StreakPill } from '@/components/ui/StreakPill';
import { WeekStrip } from '@/components/ui/WeekStrip';
import { useStreaks } from '@/features/activities/api';
import { isStreakAlive } from '@/features/activities/streaks';
import { RankMoment } from '@/features/ranks/components/RankMoment';
import { useWeeklyReport } from '@/features/stats/api';
import { formatXp } from '@/lib/utils/format';
import type { ActivityLogResponse } from '../types';

const moreLink =
  'inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent no-underline hover:underline';

function StreakCard({ log }: { log: ActivityLogResponse }) {
  const streaks = useStreaks();
  // The streaks endpoint is refetched after saving, so it is fresher than a cached response.
  const row = streaks.data?.find((s) => s.activityId === log.activity.id);
  const current = row?.currentStreak ?? log.currentStreak;
  const longest = row?.longestStreak;
  const alive = row ? isStreakAlive(row) : current > 0;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm text-muted">Streak</h2>
      {streaks.isPending ? (
        <Skeleton className="h-8 w-32" />
      ) : alive && current > 0 ? (
        <>
          <p className="flex items-center gap-3 font-bold">
            <StreakPill count={current} />
            {current}-day streak
          </p>
          {longest !== undefined && (
            <p className="text-sm text-soft">
              Longest on {log.activity.name}: {longest} days
            </p>
          )}
        </>
      ) : (
        <p className="text-soft">Log {log.activity.name} again tomorrow to start a streak.</p>
      )}
      <Link to={`/app/activities/${log.activity.id}`} className={moreLink}>
        {log.activity.name} details <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Card>
  );
}

function WeekCard({ addedXp }: { addedXp: number }) {
  const report = useWeeklyReport();
  // Wait for the post-save refetch, otherwise today's bar would animate from stale numbers.
  const settling = report.isPending || report.isFetching;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm text-muted">This week</h2>
      {settling ? (
        <Skeleton className="h-28 w-full" />
      ) : report.isError ? (
        <p className="text-soft">Couldn&apos;t load your week.</p>
      ) : (
        <>
          <p className="font-mono text-xl font-bold text-xp">
            {formatXp(report.data.currentWeekXp)}
          </p>
          <WeekStrip days={report.data.dailyBreakdown} addedXp={addedXp} />
        </>
      )}
      <Link to="/app/stats" className={moreLink}>
        All stats <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Card>
  );
}

/** Streak, this week and rank, each one tap from its full screen. */
export function ResultAnalytics({ log }: { log: ActivityLogResponse }) {
  const awarded = log.reviewStatus === 'CLEARED' || log.reviewStatus === 'APPROVED';
  return (
    <section aria-label="Other analytics" className="grid gap-3 sm:grid-cols-2">
      <StreakCard log={log} />
      <WeekCard addedXp={awarded ? log.xpEarned : 0} />
      <div className="sm:col-span-2">
        <RankMoment />
      </div>
    </section>
  );
}
