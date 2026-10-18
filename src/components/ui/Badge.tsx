import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils/cn';

type Tone = 'neutral' | 'accent' | 'xp' | 'streak' | 'rank' | 'danger';

const TONES: Record<Tone, string> = {
  neutral: 'border-line-strong text-soft',
  accent: 'border-accent/50 text-accent',
  xp: 'border-xp/50 text-xp',
  streak: 'border-streak/50 text-streak',
  rank: 'border-rank/50 text-rank',
  danger: 'border-danger/50 text-danger',
};

export function Badge({
  tone = 'neutral',
  className,
  ...rest
}: ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1 font-mono text-xs font-bold',
        TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}
