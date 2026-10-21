import type { CategoryTotal } from '@/features/stats/types';
import { CATEGORY_LABEL } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';
import { CATEGORY_ICON } from '@/lib/utils/category';
import { formatDuration, formatNumber, formatXp } from '@/lib/utils/format';

type CategoryBarsProps = {
  /** In the order to show them; the first row is drawn in the accent colour. */
  rows: readonly CategoryTotal[];
  label: string;
  className?: string;
};

/** Minutes per category as horizontal bars, with XP and sessions under each. */
export function CategoryBars({ rows, label, className }: CategoryBarsProps) {
  // Bars are as long as the row with the most time, whichever order the rows are in.
  const longest = Math.max(0, ...rows.map((r) => r.totalDurationMinutes));
  return (
    <ul className={cn('flex flex-col gap-4', className)} aria-label={label}>
      {rows.map((row, i) => {
        const Icon = CATEGORY_ICON[row.category];
        const width = longest ? (row.totalDurationMinutes / longest) * 100 : 0;
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
  );
}
