import { ArrowDown, ArrowUp, ChevronsUp, Minus, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Movement, MovementKind } from '../steps';

const ICON: Record<MovementKind, LucideIcon> = {
  new: Sparkles,
  promoted: ChevronsUp,
  up: ArrowUp,
  steady: Minus,
  down: ArrowDown,
  demoted: ArrowDown,
};

const TONE: Record<MovementKind, string> = {
  new: 'text-accent',
  promoted: 'text-accent',
  up: 'text-accent',
  steady: 'text-muted',
  // Setbacks are quiet, never red: the climb continues.
  down: 'text-soft',
  demoted: 'text-soft',
};

type MovementChipProps = {
  movement: Movement;
  /** `row` is the short form for a table; `card` is the full sentence. */
  variant?: 'card' | 'row';
  className?: string;
};

/** Movement as an icon and words, so it never relies on colour alone. */
export function MovementChip({ movement, variant = 'card', className }: MovementChipProps) {
  const Icon = ICON[movement.kind];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        variant === 'row' ? 'font-mono text-sm' : 'text-[15px]',
        TONE[movement.kind],
        className,
      )}
    >
      <Icon className={variant === 'row' ? 'size-3.5' : 'size-4'} aria-hidden="true" />
      {variant === 'row' ? (
        <>
          <span aria-hidden="true">{movement.short}</span>
          <span className="sr-only">{movement.label}</span>
        </>
      ) : (
        movement.label
      )}
    </span>
  );
}
