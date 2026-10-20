import { describe, expect, it } from 'vitest';
import { clock, hourRange, localMinute, toLocalDay } from './hours';
import type { HourBucket } from './types';

const IST = -330; // Date#getTimezoneOffset is minutes behind UTC, so zones ahead are negative
const NEW_YORK = 240;

const buckets: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  totalDurationMinutes: 0,
  totalXpEarned: hour,
  totalSessions: 0,
}));

describe('localMinute', () => {
  it('moves a UTC hour onto an IST clock, half hour included', () => {
    expect(localMinute(3, IST)).toBe(8 * 60 + 30);
    expect(localMinute(14, IST)).toBe(19 * 60 + 30);
  });

  it('wraps past midnight in both directions', () => {
    expect(localMinute(20, IST)).toBe(60 + 30); // 01:30 the next day
    expect(localMinute(2, NEW_YORK)).toBe(22 * 60); // 22:00 the day before
  });

  it('leaves UTC alone', () => {
    expect(localMinute(9, 0)).toBe(9 * 60);
  });
});

describe('toLocalDay', () => {
  it('starts at local midnight and keeps all 24 buckets', () => {
    const day = toLocalDay(buckets, NEW_YORK);
    expect(day).toHaveLength(24);
    expect(day[0]).toMatchObject({ hour: 4, startMinute: 0 }); // 04:00 UTC is midnight in New York
    expect(day[23]).toMatchObject({ hour: 3, startMinute: 23 * 60 });
  });

  it('starts at the half hour in a half-hour zone', () => {
    const day = toLocalDay(buckets, IST);
    expect(day[0]).toMatchObject({ hour: 19, startMinute: 30 }); // 19:00 UTC is 00:30 IST
    expect(day.map((d) => d.startMinute)).toEqual(
      [...day.map((d) => d.startMinute)].sort((a, b) => a - b),
    );
  });
});

describe('clock and hourRange', () => {
  it('writes 12-hour times', () => {
    expect(clock(0)).toBe('12 am');
    expect(clock(12 * 60)).toBe('12 pm');
    expect(clock(19 * 60 + 30)).toBe('7:30 pm');
  });

  it('shares am or pm when both ends have it', () => {
    expect(hourRange(8 * 60 + 30)).toBe('8:30–9:30 am');
    expect(hourRange(19 * 60)).toBe('7–8 pm');
  });

  it('names both when the hour crosses noon or midnight', () => {
    expect(hourRange(11 * 60 + 30)).toBe('11:30 am–12:30 pm');
    expect(hourRange(23 * 60)).toBe('11 pm–12 am');
  });
});
