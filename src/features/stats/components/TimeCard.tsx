import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { CATEGORY_LABEL } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';
import { CATEGORY_ICON } from '@/lib/utils/category';
import { formatDuration, formatNumber, formatXp } from '@/lib/utils/format';
import { useCategorySummary } from '../api';
import { StatCard } from './StatCard';

const QUESTION = 'Where does my time go?';

/** Minutes per category, all time, as horizontal bars with the biggest in the accent colour. */
export function TimeCard() {
  const summary = useCategorySummary();

  if (summary.isPending) return <CardSkeleton label="Loading where your time goes" />;
  if (summary.isError) {
    return (
      <ErrorPanel
        error={summary.error}
        title="Couldn't load where your time goes"
        onRetry={() => void summary.refetch()}
      />
    );
  }

  const rows = [...summary.data].sort((a, b) => b.totalDurationMinutes - a.totalDurationMinutes);
  const top = rows[0];
  const total = rows.reduce((sum, r) => sum + r.totalDurationMinutes, 0);

  if (!top) {
    return (
      <StatCard question={QUESTION} answer="Nothing yet">
        <p className="grid min-h-[200px] place-items-center rounded-xl border border-dashed border-line-strong px-6 text-center text-soft">
          Log an activity to see where your time goes.
        </p>
      </StatCard>
    );
  }

  return (
    <StatCard
      question={QUESTION}
      answer={CATEGORY_LABEL[top.category]}
      context={`${formatDuration(top.totalDurationMinutes)} of the ${formatDuration(total)} you have logged.`}
    >
      <ul className="flex flex-col gap-4" aria-label="Time by category">
        {rows.map((row, i) => {
          const Icon = CATEGORY_ICON[row.category];
          const width = top.totalDurationMinutes
            ? (row.totalDurationMinutes / top.totalDurationMinutes) * 100
            : 0;
          return (
            <li key={row.category} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-2 font-medium">
                  <Icon className="size-4 shrink-0 text-soft" aria-hidden="true" />
                  {CATEGORY_LABEL[row.category]}
                </span>
                <span className="font-mono text-[15px]">
                  {formatDuration(row.totalDurationMinutes)}
                </span>
              </div>
              <div aria-hidden="true" className="h-3 rounded-full bg-surface-2">
                <div
                  className={cn('h-full rounded-full', i === 0 ? 'bg-accent' : 'bg-text-faint')}
                  style={{ width: `${width}%`, minWidth: 6 }}
                />
              </div>
              <p className="text-sm text-muted">
                {formatXp(row.totalXpEarned)} from {formatNumber(row.totalSessions)}{' '}
                {row.totalSessions === 1 ? 'session' : 'sessions'}
              </p>
            </li>
          );
        })}
      </ul>
    </StatCard>
  );
}
