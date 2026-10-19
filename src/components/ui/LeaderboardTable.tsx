import { User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/format';
import { displayName } from '@/lib/utils/names';

export type LeaderboardRow = {
  position: number;
  userId: number;
  totalXp: number;
  /** Shown as a "Lv" column when any row has one. */
  level?: number;
};

type LeaderboardTableProps = {
  rows: readonly LeaderboardRow[];
  currentUserId?: number | null;
  /** Screen-reader title for the table. */
  caption: string;
  className?: string;
};

/** A real table (position · person · XP) so screen readers can navigate it; own row highlighted. */
export function LeaderboardTable({
  rows,
  currentUserId,
  caption,
  className,
}: LeaderboardTableProps) {
  const hasLevel = rows.some((r) => r.level !== undefined);

  return (
    <table className={cn('w-full border-collapse text-left', className)}>
      <caption className="sr-only">{caption}</caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Position</th>
          <th scope="col">Player</th>
          {hasLevel && <th scope="col">Level</th>}
          <th scope="col">XP</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const own = row.userId === currentUserId;
          return (
            <tr
              key={`${row.position}-${row.userId}`}
              aria-current={own ? 'true' : undefined}
              className={cn('border-b border-line last:border-0', own && 'bg-surface-2')}
            >
              <td className="w-12 py-2.5 pl-2 font-mono text-sm text-muted">#{row.position}</td>
              <td className="py-2.5">
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-full border',
                      own ? 'border-accent text-accent' : 'border-line-strong text-faint',
                    )}
                  >
                    <User className="size-4" />
                  </span>
                  <span className={cn('truncate text-[15px]', own ? 'font-bold' : 'text-soft')}>
                    {displayName(row.userId, currentUserId)}
                  </span>
                </span>
              </td>
              {hasLevel && (
                <td className="py-2.5 pr-3 text-right font-mono text-sm text-muted">
                  {row.level !== undefined ? `Lv ${row.level}` : ''}
                </td>
              )}
              <td className="py-2.5 pr-2 text-right font-mono text-sm font-bold text-xp">
                {formatNumber(Math.round(row.totalXp))}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
