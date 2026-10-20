import { useState, type KeyboardEvent, type PointerEvent } from 'react';
import { formatDuration, formatXp } from '@/lib/utils/format';
import { dayLabel } from '../dates';
import type { DailyXp } from '../types';

const W = 600;
const H = 200;
const TOP = 0.12; // share of the height kept free above the tallest day, for the flag
const RULES = [0.25, 0.5, 0.75]; // contour rules, as a share of the height

type ElevationChartProps = {
  /** Daily XP, oldest first. */
  days: readonly DailyXp[];
  /** Called with the day under the pointer or keyboard focus, null when it leaves. */
  onActive: (day: DailyXp | null) => void;
};

/**
 * Daily XP drawn as the profile of a climb: a filled silhouette with the route along its ridge,
 * contour rules behind it, and a flag on the best day. Pointer or arrow keys scrub along it.
 */
export function ElevationChart({ days, onActive }: ElevationChartProps) {
  const [index, setIndex] = useState<number | null>(null);
  const n = days.length;
  const max = Math.max(1, ...days.map((d) => d.totalXpEarned));
  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (xp: number) => H - (xp / max) * H * (1 - TOP);

  const ridge = days
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(d.totalXpEarned).toFixed(1)}`)
    .join(' ');
  const silhouette = `${ridge} L${W} ${H} L0 ${H} Z`;

  const best = days.reduce(
    (top, d, i) => (d.totalXpEarned > (days[top]?.totalXpEarned ?? 0) ? i : top),
    0,
  );
  const percentX = (i: number) => `${(x(i) / W) * 100}%`;
  const percentY = (xp: number) => `${(y(xp) / H) * 100}%`;

  function move(next: number | null) {
    setIndex(next);
    onActive(next === null ? null : (days[next] ?? null));
  }

  function fromPointer(e: PointerEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const share = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    move(Math.round(share * (n - 1)));
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const current = index ?? best;
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowUp'
        ? Math.min(n - 1, current + 1)
        : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
          ? Math.max(0, current - 1)
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? n - 1
              : null;
    if (next === null) return;
    e.preventDefault();
    move(next);
  }

  const active = index === null ? undefined : days[index];
  const bestDay = days[best];

  return (
    <div className="flex flex-col gap-2">
      <div
        role="slider"
        tabIndex={0}
        aria-label="Daily XP"
        aria-valuemin={0}
        aria-valuemax={n - 1}
        aria-valuenow={index ?? best}
        aria-valuetext={
          active
            ? `${dayLabel(active.date)}: ${formatXp(active.totalXpEarned)}, ${formatDuration(active.totalDurationMinutes)}`
            : undefined
        }
        onKeyDown={onKeyDown}
        onFocus={() => move(index ?? best)}
        onBlur={() => move(null)}
        onPointerMove={fromPointer}
        onPointerDown={fromPointer}
        onPointerLeave={() => move(null)}
        className="relative h-[200px] w-full cursor-crosshair touch-pan-y rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text"
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-0 size-full overflow-visible"
        >
          {RULES.map((r) => (
            <line
              key={r}
              x1={0}
              x2={W}
              y1={H * r}
              y2={H * r}
              className="stroke-line"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          <path d={silhouette} className="fill-text/10" />
          <path
            d={ridge}
            fill="none"
            className="stroke-accent"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={0}
            x2={W}
            y1={H}
            y2={H}
            className="stroke-line-strong"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {bestDay && bestDay.totalXpEarned > 0 && (
          <span
            aria-hidden="true"
            data-testid="summit-flag"
            className="pointer-events-none absolute -translate-x-px -translate-y-full"
            style={{ left: percentX(best), top: percentY(bestDay.totalXpEarned) }}
          >
            <span className="block h-5 w-px bg-text" />
            <span className="absolute top-0 left-px block h-2.5 w-3.5 bg-text [clip-path:polygon(0_0,100%_50%,0_100%)]" />
          </span>
        )}

        {active && index !== null && (
          <>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 w-px bg-text/40"
              style={{ left: percentX(index) }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent"
              style={{ left: percentX(index), top: percentY(active.totalXpEarned) }}
            />
          </>
        )}
      </div>

      <div aria-hidden="true" className="flex justify-between font-mono text-xs text-muted">
        <span>{days[0] ? dayLabel(days[0].date) : ''}</span>
        <span>{days[n - 1] ? dayLabel(days[n - 1]?.date ?? '') : ''}</span>
      </div>

      <table className="sr-only">
        <caption>XP by day</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>XP</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <th>{dayLabel(d.date)}</th>
              <td>{formatXp(d.totalXpEarned)}</td>
              <td>{formatDuration(d.totalDurationMinutes)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
