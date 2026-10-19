import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function StreakPill({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-streak/50 bg-surface px-3 py-1 font-mono text-xs font-bold text-streak',
        className,
      )}
    >
      <Flame className="size-3.5" aria-hidden="true" />
      {count}
      <span className="sr-only"> day streak</span>
    </span>
  );
}
