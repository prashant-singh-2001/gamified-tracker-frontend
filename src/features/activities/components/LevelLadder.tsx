import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/format';
import type { LadderRow } from '../levels';

/** The levels around yours with the XP each needs: past ones ticked, yours highlighted. */
export function LevelLadder({ rows }: { rows: readonly LadderRow[] }) {
  return (
    <ol aria-label="Level ladder" className="flex flex-col">
      {rows.map((row) => (
        <li
          key={row.level}
          aria-current={row.state === 'current' ? 'step' : undefined}
          className={cn(
            'flex min-h-12 items-center gap-3 border-b border-line px-2 last:border-0',
            row.state === 'current' && 'rounded-lg bg-surface-2',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full border',
              row.state === 'past' && 'border-text bg-text text-bg',
              row.state === 'current' && 'border-accent bg-accent text-accent-ink',
              row.state === 'next' && 'border-line-strong',
            )}
          >
            {row.state === 'past' && <Check className="size-3.5" />}
          </span>
          <span className={cn('flex-1', row.state === 'current' ? 'font-bold' : 'text-soft')}>
            Level {row.level}
            {row.state === 'past' && <span className="sr-only">, reached</span>}
            {row.state === 'current' && (
              <span className="font-medium text-accent"> · You are here</span>
            )}
          </span>
          <span className="font-mono text-[15px] text-muted">
            {formatNumber(Math.round(row.xpRequired))} XP
          </span>
        </li>
      ))}
    </ol>
  );
}
