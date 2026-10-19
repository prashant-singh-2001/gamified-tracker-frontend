import { useEffect, useState } from 'react';
import type { DailyXp } from '@/features/stats/types';
import { cn } from '@/lib/utils/cn';
import { formatXp } from '@/lib/utils/format';
import { serverToday } from '@/lib/utils/serverTime';

type WeekStripProps = {
  /** Daily XP, oldest first (the API returns the rolling last 7 days). Empty → placeholder bars. */
  days: readonly DailyXp[];
  /** XP just earned today: today's bar grows from `total - addedXp` to `total`. */
  addedXp?: number;
  className?: string;
};

const BAR_AREA = 80; // px
const MIN_BAR = 4; // px, so a zero day still shows a stub

function weekday(date: string): string {
  // `date` is a UTC calendar day, so format it in UTC or it can slip a day in other zones.
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

/** Seven daily XP bars with today outlined. Labels are the real weekdays of the rolling week. */
export function WeekStrip({ days, addedXp = 0, className }: WeekStripProps) {
  const today = serverToday();
  const [grown, setGrown] = useState(addedXp <= 0);

  useEffect(() => {
    if (addedXp <= 0) return;
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, [addedXp]);

  if (days.length === 0) {
    return (
      <ul
        className={cn('flex items-end justify-between gap-2', className)}
        aria-label="No activity yet this week"
      >
        {Array.from({ length: 7 }, (_, i) => (
          <li key={i} className="flex flex-1 flex-col items-center gap-2">
            <div
              aria-hidden="true"
              className="w-full rounded-md border border-dashed border-line-strong"
              style={{ height: BAR_AREA / 2 }}
            />
            <span className="text-xs text-faint">·</span>
          </li>
        ))}
      </ul>
    );
  }

  const shown = (day: DailyXp) =>
    day.date === today && addedXp > 0 && !grown
      ? Math.max(0, day.totalXpEarned - addedXp)
      : day.totalXpEarned;
  const max = Math.max(1, ...days.map((d) => d.totalXpEarned));

  return (
    <ul className={cn('flex items-end justify-between gap-2', className)}>
      {days.map((day) => {
        const isToday = day.date === today;
        const height = Math.max(MIN_BAR, (shown(day) / max) * BAR_AREA);
        return (
          <li
            key={day.date}
            className="flex flex-1 flex-col items-center gap-2"
            aria-label={`${weekday(day.date)}${isToday ? ' (today)' : ''}: ${formatXp(day.totalXpEarned)}`}
          >
            <div className="flex w-full items-end" style={{ height: BAR_AREA }}>
              <div
                aria-hidden="true"
                className={cn(
                  'w-full rounded-md bg-accent transition-[height] duration-500',
                  day.totalXpEarned === 0 && 'bg-line',
                  isToday && 'outline-2 outline-offset-2 outline-accent/60',
                )}
                style={{ height }}
              />
            </div>
            <span
              aria-hidden="true"
              className={cn('font-mono text-xs', isToday ? 'font-bold text-text' : 'text-muted')}
            >
              {weekday(day.date).slice(0, 3)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
