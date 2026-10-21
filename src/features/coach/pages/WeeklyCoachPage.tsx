import { Link } from 'react-router';
import { CategoryBars } from '@/components/ui/CategoryBars';
import { buttonClass } from '@/components/ui/buttonStyles';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { useWeeklyInsights } from '../api';
import { CoachLetter } from '../components/CoachLetter';
import { WeekFacts } from '../components/WeekFacts';

/**
 * Your week as a short letter, then the facts behind it. The numbers always come from the API's
 * totals, never from the note, so the screen stays useful when the coach is off or cannot write.
 */
export default function WeeklyCoachPage() {
  const insights = useWeeklyInsights();

  if (insights.isError) {
    return (
      <div className="mx-auto w-full max-w-[38rem]">
        <ErrorPanel
          error={insights.error}
          title="Couldn't load your week"
          onRetry={() => void insights.refetch()}
        />
      </div>
    );
  }

  if (insights.isPending) {
    return (
      <div className="mx-auto flex w-full max-w-[38rem] flex-col gap-10">
        <CoachLetter
          week={null}
          status="loading"
          narrative={null}
          writtenAt={0}
          writing={false}
          onWrite={() => undefined}
        />
        <div role="status" aria-label="Loading your numbers" className="grid gap-6 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  const week = insights.data;
  const byXp = [...week.categories].sort((a, b) => b.totalXpEarned - a.totalXpEarned);

  return (
    <div className="mx-auto flex w-full max-w-[38rem] flex-col gap-10">
      <CoachLetter
        week={{ start: week.weekStart, end: week.weekEnd }}
        status={week.narrativeStatus}
        narrative={week.narrative}
        writtenAt={insights.dataUpdatedAt}
        writing={insights.isFetching}
        onWrite={() => void insights.refetch()}
      />

      <WeekFacts totals={week.totals} />

      <section aria-labelledby="by-category" className="flex flex-col gap-4">
        <h2 id="by-category" className="font-display text-3xl leading-none font-extrabold">
          By category
        </h2>
        {byXp.length > 0 ? (
          <CategoryBars rows={byXp} label="This week by category" />
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-line-strong px-6 py-8">
            <p className="text-soft">
              Log an activity this week and your coach will have something to write about.
            </p>
            <Link to="/app/log" className={buttonClass('primary', 'lg')}>
              Log activity
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
