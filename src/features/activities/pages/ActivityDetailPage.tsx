import { Link, useParams } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { buttonClass } from '@/components/ui/buttonStyles';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { StreakPill } from '@/components/ui/StreakPill';
import { useLogPages } from '@/features/history/api';
import { LogRow } from '@/features/history/components/LogRow';
import { isNotFound } from '@/lib/api/errors';
import { CATEGORY_LABEL } from '@/lib/api/types';
import { CATEGORY_ICON } from '@/lib/utils/category';
import { formatMultiplier, formatNumber } from '@/lib/utils/format';
import { NO_FILTERS } from '@/features/history/types';
import { useActivity, useLadder, useMyLevels, useStreaks } from '../api';
import { LevelLadder } from '../components/LevelLadder';
import { LevelRing } from '../components/LevelRing';
import { ladderWindow, levelProgress } from '../levels';
import { isStreakAlive } from '../streaks';
import { effectiveMultiplier } from '../types';

const lastDay = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

/**
 * How far you are in one activity: the level ring, the streak, what the next levels cost, and your
 * last sessions. It opens from a level-up notification and from History.
 */
export default function ActivityDetailPage() {
  const params = useParams();
  const activityId = Number(params.activityId);
  const activity = useActivity(activityId);
  const levels = useMyLevels();
  const streaks = useStreaks();

  const tracker = levels.data?.find((l) => l.activityId === activityId);
  const ladder = useLadder(activityId, (tracker?.level ?? 1) + 5);
  const recent = useLogPages({ ...NO_FILTERS, activityId });

  if (activity.isPending) {
    return (
      <div
        role="status"
        aria-label="Loading this activity"
        className="mx-auto flex w-full max-w-3xl flex-col gap-6"
      >
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-44" />
        <Skeleton className="h-60" />
      </div>
    );
  }

  if (activity.isError) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        {isNotFound(activity.error) ? (
          <EmptyState
            title="This activity isn't available"
            description="It may have been removed. Your logged sessions are still in History."
            action={
              <Link to="/app/history" className={buttonClass('secondary', 'lg')}>
                Open History
              </Link>
            }
          />
        ) : (
          <ErrorPanel
            error={activity.error}
            title="Couldn't load this activity"
            onRetry={() => void activity.refetch()}
          />
        )}
      </div>
    );
  }

  const a = activity.data;
  const Icon = CATEGORY_ICON[a.category];
  const progress = levelProgress(tracker, ladder.data ?? []);
  const streak = streaks.data?.find((s) => s.activityId === activityId);
  const alive = streak ? isStreakAlive(streak) : false;
  const sessions = (recent.data?.pages[0]?.content ?? []).slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-display text-[clamp(3.5rem,7vw,6rem)] leading-[0.88] font-extrabold">
          {a.name}
        </h1>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-lg text-soft">
          <span className="inline-flex items-center gap-2">
            <Icon className="size-5" aria-hidden="true" />
            {CATEGORY_LABEL[a.category]}
          </span>
          <span className="rounded-full border border-xp/50 px-3 font-mono text-sm font-bold text-xp">
            {formatMultiplier(effectiveMultiplier(a))} XP
          </span>
        </p>
      </header>

      <section aria-label="Your level" className="flex flex-wrap items-center gap-x-10 gap-y-6">
        {levels.isPending ? (
          <Skeleton className="size-40 rounded-full" />
        ) : (
          <LevelRing
            level={progress.level}
            percent={progress.percent}
            nextLevel={progress.nextLevel}
          />
        )}
        <div className="flex min-w-[15rem] flex-1 flex-col gap-3">
          {levels.isError ? (
            <p className="text-soft">Couldn&apos;t load your level.</p>
          ) : !tracker && levels.isSuccess ? (
            <p className="text-lg text-soft">Log it once to start levelling.</p>
          ) : progress.nextLevel === null ? (
            <p className="text-lg">You&apos;re at the top of the ladder.</p>
          ) : (
            <p className="text-lg">
              <span className="font-mono font-bold text-xp">
                {formatNumber(Math.round(progress.inLevel))} /{' '}
                {formatNumber(Math.round(progress.bandSize ?? 0))} XP
              </span>{' '}
              to level {progress.nextLevel}
            </p>
          )}

          <Card className="flex flex-col gap-1 p-4">
            <h2 className="text-sm text-muted">Streak</h2>
            {streaks.isPending ? (
              <Skeleton className="h-8 w-40" />
            ) : streak && alive && streak.currentStreak > 0 ? (
              <p className="flex items-center gap-3 font-bold">
                <StreakPill count={streak.currentStreak} />
                {streak.currentStreak}-day streak
              </p>
            ) : (
              <p className="text-soft">No streak right now. Log it today to start one.</p>
            )}
            {streak && (
              <p className="text-sm text-muted">
                Longest: {streak.longestStreak} {streak.longestStreak === 1 ? 'day' : 'days'}
                {streak.lastActivityDate && <> · Last logged {lastDay(streak.lastActivityDate)}</>}
              </p>
            )}
          </Card>
        </div>
      </section>

      <section aria-labelledby="ladder-title" className="flex flex-col gap-3">
        <h2 id="ladder-title" className="font-display text-3xl leading-none font-extrabold">
          Level ladder
        </h2>
        {ladder.isPending ? (
          <Skeleton className="h-60" />
        ) : ladder.isError ? (
          <ErrorPanel
            error={ladder.error}
            title="Couldn't load the ladder"
            onRetry={() => void ladder.refetch()}
          />
        ) : (
          <LevelLadder rows={ladderWindow(ladder.data, progress.level)} />
        )}
      </section>

      <section aria-labelledby="recent-title" className="flex flex-col gap-3">
        <h2 id="recent-title" className="font-display text-3xl leading-none font-extrabold">
          Recent sessions
        </h2>
        {recent.isPending ? (
          <Skeleton className="h-40" />
        ) : sessions.length === 0 ? (
          <p className="text-soft">No sessions yet.</p>
        ) : (
          <ul className="flex flex-col">
            {sessions.map((log) => (
              <li key={log.id} className="border-b border-line last:border-0">
                <LogRow log={log} search="" />
              </li>
            ))}
          </ul>
        )}
        <Link
          to={`/app/history?activity=${a.id}`}
          className="inline-flex min-h-11 items-center gap-1.5 self-start text-[15px] font-medium text-accent no-underline hover:underline"
        >
          See all in History <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>

      <Link
        to={`/app/log?activity=${encodeURIComponent(a.name)}`}
        className={buttonClass('primary', 'lg', 'self-start rounded-full px-8')}
      >
        Log this activity
      </Link>
    </div>
  );
}
