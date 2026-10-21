import { Change } from '@/features/stats/components/Change';
import type { WeeklyReport } from '@/features/stats/types';
import { CATEGORY_LABEL } from '@/lib/api/types';
import { CATEGORY_ICON } from '@/lib/utils/category';
import { formatDuration, formatXp } from '@/lib/utils/format';

/** The three numbers behind the letter, plain and without cards. They never come from the note. */
export function WeekFacts({ totals }: { totals: WeeklyReport }) {
  const TopIcon = totals.topCategory ? CATEGORY_ICON[totals.topCategory] : null;
  const quiet = totals.currentWeekXp === 0 && totals.previousWeekXp === 0;

  return (
    <dl className="grid gap-6 sm:grid-cols-[1.5fr_1fr_1fr]">
      <div className="flex flex-col gap-1 border-t border-line-strong pt-3">
        <dt className="text-sm text-muted">XP this week</dt>
        <dd className="font-display text-4xl leading-none font-extrabold">
          {formatXp(totals.currentWeekXp)}
        </dd>
        <dd className="text-sm text-soft">
          {quiet ? 'Nothing logged yet.' : <Change value={totals.percentageChange} />}
        </dd>
      </div>
      <div className="flex flex-col gap-1 border-t border-line-strong pt-3">
        <dt className="text-sm text-muted">Time active</dt>
        <dd className="font-display text-4xl leading-none font-extrabold">
          {formatDuration(totals.totalActiveMinutes)}
        </dd>
      </div>
      <div className="flex flex-col gap-1 border-t border-line-strong pt-3">
        <dt className="text-sm text-muted">Top category</dt>
        <dd className="flex items-center gap-2 font-display text-4xl leading-none font-extrabold">
          {TopIcon && totals.topCategory ? (
            <>
              <TopIcon className="size-7 shrink-0 text-soft" aria-hidden="true" />
              {CATEGORY_LABEL[totals.topCategory]}
            </>
          ) : (
            'None yet'
          )}
        </dd>
      </div>
    </dl>
  );
}
