import { useMemo } from 'react';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { CATEGORY_LABEL } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';
import { formatDuration, formatNumber, formatXp } from '@/lib/utils/format';
import { useBestTime } from '../api';
import { clock, hourRange, localMinute, toLocalDay, type LocalHour } from '../hours';
import { useReadout } from '../useReadout';
import { useScrub } from '../useScrub';
import { StatCard } from './StatCard';

const QUESTION = 'When am I most productive?';
const LABEL_EVERY = 6; // bars between the clock labels under the chart

function describe(h: LocalHour) {
  const sessions = `${formatNumber(h.totalSessions)} ${h.totalSessions === 1 ? 'session' : 'sessions'}`;
  return `${hourRange(h.startMinute)} · ${formatXp(h.totalXpEarned)} · ${formatDuration(h.totalDurationMinutes)} · ${sessions}`;
}

/**
 * XP by hour of the day in the viewer's own time. The API buckets by UTC hour, so each bucket is
 * moved onto the local clock before it is drawn or named.
 */
export function BestTimeCard() {
  const best = useBestTime();
  const readout = useReadout('Move along the bars for each hour.');
  const day = useMemo(() => toLocalDay(best.data?.hourlyBreakdown ?? []), [best.data]);
  const bestIndex = day.findIndex((h) => h.hour === best.data?.bestHour);
  const { index, props } = useScrub(day.length, Math.max(0, bestIndex), (next) =>
    readout.show(next === null ? null : describe(day[next] as LocalHour)),
  );

  if (best.isPending) return <CardSkeleton label="Loading your best time" />;
  if (best.isError) {
    return (
      <ErrorPanel
        error={best.error}
        title="Couldn't load your best time"
        onRetry={() => void best.refetch()}
      />
    );
  }

  const { bestHour, bestCategory, bestCategoryHour } = best.data;
  const top = bestIndex >= 0 ? day[bestIndex] : undefined;

  if (bestHour === null || !top) {
    return (
      <StatCard question={QUESTION} answer="Not yet">
        <p className="grid min-h-[200px] place-items-center rounded-xl border border-dashed border-line-strong px-6 text-center text-soft">
          Log a few sessions to find your best time.
        </p>
      </StatCard>
    );
  }

  const max = Math.max(1, ...day.map((h) => h.totalXpEarned));
  const note =
    bestCategory && bestCategoryHour !== null
      ? `Most ${CATEGORY_LABEL[bestCategory]} XP comes around ${clock(localMinute(bestCategoryHour))}.`
      : undefined;

  return (
    <StatCard
      question={QUESTION}
      answer={hourRange(top.startMinute)}
      context={note}
      readout={readout.text}
    >
      <div
        role="slider"
        aria-label="XP by hour of the day"
        aria-valuemin={0}
        aria-valuemax={day.length - 1}
        aria-valuenow={index ?? Math.max(0, bestIndex)}
        aria-valuetext={index === null ? undefined : describe(day[index] as LocalHour)}
        {...props}
        className="flex h-[200px] cursor-crosshair touch-pan-y items-end gap-[3px] rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
      >
        {day.map((h, i) => (
          <div
            key={h.hour}
            aria-hidden="true"
            data-testid={h.hour === bestHour ? 'best-hour-bar' : undefined}
            className={cn(
              'flex-1 rounded-t-sm',
              h.hour === bestHour ? 'bg-accent' : h.totalXpEarned > 0 ? 'bg-text-faint' : 'bg-line',
              index === i && 'outline-2 outline-offset-1 outline-text',
            )}
            style={{ height: `${(h.totalXpEarned / max) * 100}%`, minHeight: 3 }}
          />
        ))}
      </div>
      <div aria-hidden="true" className="relative mt-2 h-4 font-mono text-xs text-muted">
        {day.map((h, i) =>
          i % LABEL_EVERY === 0 ? (
            <span key={h.hour} className="absolute" style={{ left: `${(i / day.length) * 100}%` }}>
              {clock(h.startMinute)}
            </span>
          ) : null,
        )}
      </div>

      <table className="sr-only">
        <caption>XP by hour of the day, in your time zone</caption>
        <thead>
          <tr>
            <th>Hour</th>
            <th>XP</th>
            <th>Time</th>
            <th>Sessions</th>
          </tr>
        </thead>
        <tbody>
          {day.map((h) => (
            <tr key={h.hour}>
              <th>{hourRange(h.startMinute)}</th>
              <td>{formatXp(h.totalXpEarned)}</td>
              <td>{formatDuration(h.totalDurationMinutes)}</td>
              <td>{formatNumber(h.totalSessions)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </StatCard>
  );
}
