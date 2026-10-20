import type { Ref } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/format';
import { displayName } from '@/lib/utils/names';

const MAX_ROW = 64; // px; see `stretch`

export type LeaderboardRow = {
  position: number;
  userId: number;
  totalXp: number;
  /** From the API ("Ada L."); without it the row reads "Climber #id". */
  name?: string | null;
  /** Shown as a "Lv" column when any row has one. */
  level?: number;
};

type LeaderboardTableProps = {
  rows: readonly LeaderboardRow[];
  currentUserId?: number | null;
  /** Screen-reader title for the table. */
  caption: string;
  /**
   * Let the rows share spare height from a taller card (each row grows to at most 64px), so a
   * stretched card is filled by its list instead of by blank space. Needs a flex parent.
   */
  stretch?: boolean;
  /** Ref to the signed-in user's row, e.g. to watch whether it is on screen. */
  ownRowRef?: Ref<HTMLTableRowElement>;
  className?: string;
};

/** A real table (position · person · XP) so screen readers can navigate it; own row highlighted. */
export function LeaderboardTable({
  rows,
  currentUserId,
  caption,
  stretch = false,
  ownRowRef,
  className,
}: LeaderboardTableProps) {
  const hasLevel = rows.some((r) => r.level !== undefined);

  return (
    <div
      className={cn('@container', stretch && 'min-h-0 flex-1')}
      style={stretch ? { maxHeight: rows.length * MAX_ROW } : undefined}
    >
      <table className={cn('w-full border-collapse text-left', stretch && 'h-full', className)}>
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
                ref={own ? ownRowRef : undefined}
                aria-current={own ? 'true' : undefined}
                className={cn('border-b border-line last:border-0', own && 'bg-surface-2')}
              >
                <td className="w-14 py-1.5 pr-2 pl-2 whitespace-nowrap font-mono text-sm text-muted">
                  #{row.position}
                </td>
                <td className="w-full max-w-0 py-1.5">
                  <span className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        'hidden size-7 shrink-0 place-items-center rounded-full border @[290px]:grid',
                        own ? 'border-accent text-accent' : 'border-line-strong text-faint',
                      )}
                    >
                      <User className="size-3.5" />
                    </span>
                    <span className={cn('truncate text-[15px]', own ? 'font-bold' : 'text-soft')}>
                      {displayName(row.userId, currentUserId, row.name)}
                    </span>
                  </span>
                </td>
                {hasLevel && (
                  <td className="py-1.5 pr-3 text-right whitespace-nowrap font-mono text-sm text-muted">
                    {row.level !== undefined ? `Lv ${row.level}` : ''}
                  </td>
                )}
                <td className="py-1.5 pr-2 text-right whitespace-nowrap font-mono text-sm font-bold text-xp">
                  {formatNumber(Math.round(row.totalXp))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
