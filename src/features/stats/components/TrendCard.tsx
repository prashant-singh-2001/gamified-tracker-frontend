import { useState } from 'react';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils/cn';
import { formatDuration, formatXp } from '@/lib/utils/format';
import { useXpOverTime } from '../api';
import { dayLabel } from '../dates';
import { useReadout } from '../useReadout';
import { ElevationChart } from './ElevationChart';
import { StatCard } from './StatCard';

const RANGES = [7, 30, 90] as const;
const MIN_ACTIVE_DAYS = 3;

function RangeChoice({ value, onChange }: { value: number; onChange: (days: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Range" className="flex gap-1">
      {RANGES.map((days) => (
        <button
          key={days}
          type="button"
          role="radio"
          aria-checked={days === value}
          onClick={() => onChange(days)}
          className={cn(
            'min-h-9 min-w-11 rounded-full border px-3 font-mono text-sm',
            days === value
              ? 'border-text bg-text text-bg'
              : 'border-line-strong text-soft hover:border-text',
          )}
        >
          {days}
          <span className="sr-only"> days</span>
        </button>
      ))}
    </div>
  );
}

/** How steady you have been: active days in the range, drawn as an elevation profile. */
export function TrendCard() {
  const [range, setRange] = useState<number>(30);
  const series = useXpOverTime(range);
  const readout = useReadout('Move along the chart for daily numbers.');
  const question = 'Am I consistent?';
  const aside = <RangeChoice value={range} onChange={setRange} />;

  if (series.isPending) return <CardSkeleton label="Loading your trend" />;
  if (series.isError) {
    return (
      <ErrorPanel
        error={series.error}
        title="Couldn't load your trend"
        onRetry={() => void series.refetch()}
      />
    );
  }

  const days = series.data;
  const active = days.filter((d) => d.totalXpEarned > 0).length;
  const best = days.reduce<(typeof days)[number] | undefined>(
    (top, d) => (d.totalXpEarned > (top?.totalXpEarned ?? 0) ? d : top),
    undefined,
  );

  return (
    <StatCard
      question={question}
      aside={aside}
      answer={`${active} of ${days.length} days`}
      context={
        best && best.totalXpEarned > 0
          ? `Best day ${dayLabel(best.date)} with ${formatXp(best.totalXpEarned)}.`
          : 'No activity in this range.'
      }
      readout={active >= MIN_ACTIVE_DAYS ? readout.text : undefined}
    >
      {active >= MIN_ACTIVE_DAYS ? (
        <ElevationChart
          days={days}
          onActive={(day) =>
            readout.show(
              day
                ? `${dayLabel(day.date)} · ${formatXp(day.totalXpEarned)} · ${formatDuration(day.totalDurationMinutes)}`
                : null,
            )
          }
        />
      ) : (
        <p className="grid min-h-[200px] place-items-center rounded-xl border border-dashed border-line-strong px-6 text-center text-soft">
          Log on {MIN_ACTIVE_DAYS} days to see a trend.
        </p>
      )}
    </StatCard>
  );
}
