import { CategoryBars } from '@/components/ui/CategoryBars';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { CATEGORY_LABEL } from '@/lib/api/types';
import { formatDuration } from '@/lib/utils/format';
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
      <CategoryBars rows={rows} label="Time by category" />
    </StatCard>
  );
}
