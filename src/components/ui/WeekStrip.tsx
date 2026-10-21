import { useEffect, useState } from 'react';
import type { DailyXp } from '@/features/stats/types';
import { cn } from '@/lib/utils/cn';
import { formatNumber, formatXp } from '@/lib/utils/format';
import { serverToday } from '@/lib/utils/serverTime';

type WeekStripProps = {
  /** Daily XP, oldest first (Monday to Sunday). Empty → placeholder bars. */
  days: readonly DailyXp[];
  /** XP just earned today: today's bar grows from `total - addedXp` to `total`. */
  addedXp?: number;
  /** Shown centred over the placeholder bars when `days` is empty. */
  emptyMessage?: string;
  /**
   * Fill the parent's height (at least 220px) and add value labels and gridlines. Without it the
   * strip is a compact 80px sparkline.
   */
  fill?: boolean;
  /**
   * Same-weekday XP from the week before, by `YYYY-MM-DD` of the day it lines up with. Drawn as a
   * dashed outline behind each bar.
   */
  ghost?: Readonly<Record<string, number>>;
  /** Makes each day focusable and reports the one hovered, focused or tapped (null on leave). */
  onActive?: (index: number | null) => void;
  className?: string;
};

const COMPACT_HEIGHT = 80; // px
const MIN_BAR = 4; // px, so a zero day still shows a stub
const TALLEST = 88; // % of the chart a full bar reaches, leaving room for its value label
const GRIDLINES = [0, 33.3, 66.6]; // % from the top of the chart

function weekday(date: string): string {
  // `date` is a UTC calendar day, so format it in UTC or it can slip a day in other zones.
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    timeZone: 'UTC',
  });
}

/** Seven daily XP bars with today outlined; days after today are empty columns, not zeros. */
export function WeekStrip({
  days,
  addedXp = 0,
  fill = false,
  emptyMessage,
  ghost,
  onActive,
  className,
}: WeekStripProps) {
  const today = serverToday();
  const [grown, setGrown] = useState(addedXp <= 0);

  useEffect(() => {
    if (addedXp <= 0) return;
    const frame = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(frame);
  }, [addedXp]);

  const wrapper = cn(fill && 'flex h-full min-h-[240px] flex-col', className);
  const chart = cn('relative', fill && 'min-h-[220px] flex-1');
  const chartStyle = fill ? undefined : { height: COMPACT_HEIGHT };

  if (days.length === 0) {
    return (
      <div className={wrapper}>
        <div className={chart} style={chartStyle}>
          <ul
            className="flex h-full items-stretch justify-between gap-2"
            aria-label="No activity yet this week"
          >
            {Array.from({ length: 7 }, (_, i) => (
              <li key={i} className="flex-1">
                <div
                  aria-hidden="true"
                  className="h-full w-full rounded-md border border-dashed border-line-strong"
                />
              </li>
            ))}
          </ul>
          {emptyMessage && (
            <p className="absolute inset-0 grid place-items-center px-6 text-center text-soft">
              <span className="rounded-xl bg-surface px-4 py-2">{emptyMessage}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  const shown = (day: DailyXp) =>
    day.date === today && addedXp > 0 && !grown
      ? Math.max(0, day.totalXpEarned - addedXp)
      : day.totalXpEarned;
  const max = Math.max(1, ...days.map((d) => d.totalXpEarned), ...Object.values(ghost ?? {}));

  return (
    <div className={wrapper}>
      <div className={chart} style={chartStyle}>
        {fill &&
          GRIDLINES.map((top) => (
            <div
              key={top}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-line/60"
              style={{ top: `${top}%` }}
            />
          ))}
        <ul className="relative flex h-full items-stretch justify-between gap-2">
          {days.map((day, index) => {
            const isToday = day.date === today;
            const upcoming = day.date > today; // ISO dates compare as text
            const percent = (shown(day) / max) * TALLEST;
            const before = ghost?.[day.date];
            const interactive = onActive && !upcoming;
            return (
              <li
                key={day.date}
                className={cn(
                  'relative flex-1',
                  interactive &&
                    'cursor-pointer rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text',
                )}
                tabIndex={interactive ? 0 : undefined}
                onMouseEnter={interactive ? () => onActive(index) : undefined}
                onMouseLeave={interactive ? () => onActive(null) : undefined}
                onFocus={interactive ? () => onActive(index) : undefined}
                onBlur={interactive ? () => onActive(null) : undefined}
                onClick={interactive ? () => onActive(index) : undefined}
                aria-label={
                  upcoming
                    ? `${weekday(day.date)}: not yet`
                    : `${weekday(day.date)}${isToday ? ' (today)' : ''}: ${formatXp(day.totalXpEarned)}`
                }
              >
                {before !== undefined && !upcoming && (
                  <div
                    aria-hidden="true"
                    data-testid="ghost-bar"
                    className="absolute inset-x-0 bottom-0 rounded-md border border-dashed border-text-faint"
                    style={{ height: `${(before / max) * TALLEST}%`, minHeight: MIN_BAR }}
                  />
                )}
                {upcoming ? (
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-8 rounded-md border border-dashed border-line-strong"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-0 bottom-0 rounded-md bg-accent transition-[height] duration-500',
                      day.totalXpEarned === 0 && 'bg-line',
                      isToday && 'outline-2 outline-offset-2 outline-accent/60',
                    )}
                    style={{ height: `${percent}%`, minHeight: MIN_BAR }}
                  />
                )}
                {fill && !upcoming && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-0 text-center font-mono text-xs',
                      isToday ? 'font-bold text-text' : 'text-soft',
                    )}
                    style={{ bottom: `calc(${percent}% + ${MIN_BAR + 6}px)` }}
                  >
                    {formatNumber(Math.round(day.totalXpEarned))}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      <ul aria-hidden="true" className="mt-2 flex justify-between gap-2">
        {days.map((day) => (
          <li
            key={day.date}
            className={cn(
              'flex-1 text-center font-mono text-xs',
              day.date === today ? 'font-bold text-text' : 'text-muted',
              day.date > today && 'opacity-60',
            )}
          >
            {weekday(day.date).slice(0, 3)}
          </li>
        ))}
      </ul>
    </div>
  );
}
