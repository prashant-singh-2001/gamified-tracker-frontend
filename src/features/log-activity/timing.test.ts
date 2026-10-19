import { describe, expect, it } from 'vitest';
import {
  clampDuration,
  isFuture,
  minutesBetween,
  parseDateTimeLocal,
  rangeFor,
  resolveEnd,
  toDateTimeLocal,
} from './timing';

// Local wall-clock constructors keep these independent of the machine's time zone.
const at = (h: number, m = 0) => new Date(2026, 9, 19, h, m, 0, 0);

describe('resolveEnd', () => {
  it('"Just now" ends a few seconds ago, to survive a browser clock slightly ahead of the server', () => {
    const now = at(15, 30);
    const end = resolveEnd('now', '', now)!;
    expect(now.getTime() - end.getTime()).toBeGreaterThan(0);
    expect(now.getTime() - end.getTime()).toBeLessThanOrEqual(30_000);
  });

  it('"1 hour ago" is exactly an hour before now', () => {
    expect(resolveEnd('hourAgo', '', at(15, 30))?.getTime()).toBe(at(14, 30).getTime());
  });

  it('"This morning" is 11:00 today once it has passed', () => {
    expect(resolveEnd('morning', '', at(15, 30))?.getTime()).toBe(at(11).getTime());
  });

  it('"This morning" before 11:00 just means now', () => {
    const now = at(9);
    const end = resolveEnd('morning', '', now)!;
    expect(end.getTime()).toBeLessThanOrEqual(now.getTime());
    expect(now.getTime() - end.getTime()).toBeLessThanOrEqual(30_000);
  });

  it('parses a custom datetime-local value as local time', () => {
    expect(resolveEnd('custom', '2026-10-19T08:45', at(15))?.getTime()).toBe(at(8, 45).getTime());
  });

  it('returns null for an unparseable custom time', () => {
    expect(resolveEnd('custom', '', at(15))).toBeNull();
    expect(resolveEnd('custom', 'tomorrow', at(15))).toBeNull();
  });
});

describe('time helpers', () => {
  it('derives start from end minus duration', () => {
    const { start, end } = rangeFor(at(10, 30), 90);
    expect(start.getTime()).toBe(at(9).getTime());
    expect(minutesBetween(start, end)).toBe(90);
  });

  it('round-trips datetime-local values', () => {
    expect(toDateTimeLocal(at(8, 5))).toBe('2026-10-19T08:05');
    expect(parseDateTimeLocal('2026-10-19T08:05')?.getTime()).toBe(at(8, 5).getTime());
  });

  it('treats times beyond a minute ahead as the future', () => {
    const now = at(15);
    expect(isFuture(new Date(now.getTime() + 30_000), now)).toBe(false); // within a minute
    expect(isFuture(at(15, 5), now)).toBe(true);
  });

  it('clamps durations into the range the backend accepts', () => {
    expect(clampDuration(0)).toBe(1);
    expect(clampDuration(5000)).toBe(1440);
    expect(clampDuration(44.6)).toBe(45);
  });
});
