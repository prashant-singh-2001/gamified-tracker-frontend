import { ArrowDown, ArrowUp } from 'lucide-react';
import type { WeeklyMode } from '../types';

/** What the change is measured against. */
const AGAINST: Record<WeeklyMode, string> = {
  calendar: 'on the same days last week',
  rolling: 'on the 7 days before',
};

/** The change as an arrow, a percentage and words, against the right window. */
export function Change({ value, mode = 'calendar' }: { value: number; mode?: WeeklyMode }) {
  if (Math.abs(value) < 0.5) return <span>No change {AGAINST[mode]}.</span>;
  const up = value > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-4" aria-hidden="true" />
      <span className="font-mono font-bold">{Math.round(Math.abs(value))}%</span>
      {up ? 'up' : 'down'} {AGAINST[mode]}
    </span>
  );
}
