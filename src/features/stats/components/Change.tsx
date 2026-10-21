import { ArrowDown, ArrowUp } from 'lucide-react';

/** The week's change on the same days last week, as an arrow, a percentage and words. */
export function Change({ value }: { value: number }) {
  if (Math.abs(value) < 0.5) return <span>No change on the same days last week.</span>;
  const up = value > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="size-4" aria-hidden="true" />
      <span className="font-mono font-bold">{Math.round(Math.abs(value))}%</span>
      {up ? 'up' : 'down'} on the same days last week
    </span>
  );
}
