import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { WeekStrip } from '@/components/ui/WeekStrip';
import { formatDuration, formatXp } from '@/lib/utils/format';
import { useWeeklyReport, useXpOverTime } from '../api';
import { dayLabel } from '../dates';
import type { WeeklyMode } from '../types';
import { useReadout } from '../useReadout';
import { Change } from './Change';
import { StatCard } from './StatCard';

const DAY = 86_400_000;
const QUESTION = 'Am I doing more than last week?';

const sevenDaysBefore = (date: string) =>
  new Date(new Date(`${date}T00:00:00Z`).getTime() - 7 * DAY).toISOString().slice(0, 10);

const CHOICES: readonly { mode: WeeklyMode; label: string }[] = [
  { mode: 'calendar', label: 'This week' },
  { mode: 'rolling', label: 'Last 7 days' },
];

/** Monday to Sunday, or the seven days ending today. The choice stays in the URL. */
function WeekChoice({ mode, onChange }: { mode: WeeklyMode; onChange: (m: WeeklyMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Which days" className="flex gap-1">
      {CHOICES.map((c) => (
        <button
          key={c.mode}
          type="button"
          role="radio"
          aria-checked={c.mode === mode}
          onClick={() => onChange(c.mode)}
          className={cn(
            'min-h-9 rounded-full border px-3 text-sm',
            c.mode === mode
              ? 'border-text bg-text text-bg'
              : 'border-line-strong text-soft hover:border-text',
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

/** This week's XP against last week's, day by day, with last week as a dashed outline. */
export function WeekCard() {
  const [params, setParams] = useSearchParams();
  const mode: WeeklyMode = params.get('week') === 'rolling' ? 'rolling' : 'calendar';
  const report = useWeeklyReport(mode);
  const series = useXpOverTime(14);
  const readout = useReadout('Hover or tap a day for its numbers.');

  // Last week's bars come from the 14-day series: the weekly report only has last week's total.
  const ghost = useMemo(() => {
    const byDate = new Map((series.data ?? []).map((d) => [d.date, d.totalXpEarned]));
    const out: Record<string, number> = {};
    for (const day of report.data?.dailyBreakdown ?? []) {
      const before = byDate.get(sevenDaysBefore(day.date));
      if (before !== undefined) out[day.date] = before;
    }
    return out;
  }, [report.data, series.data]);

  function choose(next: WeeklyMode) {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (next === 'rolling') copy.set('week', 'rolling');
        else copy.delete('week');
        return copy;
      },
      { replace: true },
    );
  }

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
  const fresh = week.currentWeekXp === 0 && week.previousWeekXp === 0;
  const days = week.dailyBreakdown;

  function show(index: number | null) {
    const day = index === null ? undefined : days[index];
    if (!day) return readout.show(null);
    const before = ghost[day.date];
    readout.show(
      [
        dayLabel(day.date),
        formatXp(day.totalXpEarned),
        formatDuration(day.totalDurationMinutes),
        before === undefined ? null : `last week ${formatXp(before)}`,
      ]
        .filter(Boolean)
        .join(' · '),
    );
  }

  return (
    <StatCard
      question={QUESTION}
      aside={<WeekChoice mode={mode} onChange={choose} />}
      answer={formatXp(week.currentWeekXp)}
      context={
        fresh ? (
          'Nothing logged yet this week.'
        ) : (
          <Change value={week.percentageChange} mode={mode} />
        )
      }
      readout={fresh ? undefined : readout.text}
    >
      <WeekStrip
        days={fresh ? [] : days}
        fill
        ghost={ghost}
        onActive={show}
        emptyMessage="Log an activity to start your week."
      />
      {!fresh && (
        <table className="sr-only">
          <caption>XP by day this week and the same day last week</caption>
          <thead>
            <tr>
              <th>Day</th>
              <th>This week</th>
              <th>Last week</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date}>
                <th>{dayLabel(d.date)}</th>
                <td>{formatXp(d.totalXpEarned)}</td>
                <td>{ghost[d.date] === undefined ? 'unknown' : formatXp(ghost[d.date] ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </StatCard>
  );
}
