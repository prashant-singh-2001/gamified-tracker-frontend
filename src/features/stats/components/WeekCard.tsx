import { useMemo } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { WeekStrip } from '@/components/ui/WeekStrip';
import { formatDuration, formatXp } from '@/lib/utils/format';
import { useWeeklyReport, useXpOverTime } from '../api';
import { dayLabel } from '../dates';
import { useReadout } from '../useReadout';
import { StatCard } from './StatCard';

const DAY = 86_400_000;
const QUESTION = 'Am I doing more than last week?';

const sevenDaysBefore = (date: string) =>
  new Date(new Date(`${date}T00:00:00Z`).getTime() - 7 * DAY).toISOString().slice(0, 10);

function Change({ value }: { value: number }) {
  if (Math.abs(value) < 0.5) return <span>No change on the same days last week.</span>;
  const up = value > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-4" aria-hidden="true" />
      <span className="font-mono font-bold">{Math.round(Math.abs(value))}%</span>
      {up ? 'up' : 'down'} on the same days last week
    </span>
  );
}

/** This week's XP against last week's, day by day, with last week as a dashed outline. */
export function WeekCard() {
  const report = useWeeklyReport();
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
      answer={formatXp(week.currentWeekXp)}
      context={fresh ? 'Nothing logged yet this week.' : <Change value={week.percentageChange} />}
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
