import type { HourBucket } from './types';

/** An hourly bucket moved onto the viewer's clock. */
export type LocalHour = HourBucket & {
  /** Minutes after local midnight the bucket starts, 0-1439. A half-hour zone gives :30. */
  startMinute: number;
};

/**
 * The API buckets by the UTC hour of each log's start time. Shift that onto the viewer's clock
 * with the zone's current offset (Date#getTimezoneOffset is minutes behind UTC, so IST is -330).
 */
export function localMinute(utcHour: number, offsetMinutes = new Date().getTimezoneOffset()) {
  return (((utcHour * 60 - offsetMinutes) % 1440) + 1440) % 1440;
}

/** The 24 buckets starting at local midnight, so the chart reads like the viewer's day. */
export function toLocalDay(
  buckets: readonly HourBucket[],
  offsetMinutes = new Date().getTimezoneOffset(),
): LocalHour[] {
  return buckets
    .map((b) => ({ ...b, startMinute: localMinute(b.hour, offsetMinutes) }))
    .sort((a, b) => a.startMinute - b.startMinute);
}

/** 510 → "8:30 am", 0 → "12 am". */
export function clock(minute: number): string {
  const h24 = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  const suffix = h24 < 12 ? 'am' : 'pm';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** "8:30–9:30 am" when both ends share am/pm, otherwise "11:30 am–12:30 pm". */
export function hourRange(startMinute: number): string {
  const start = clock(startMinute);
  const end = clock((startMinute + 60) % 1440);
  const [startTime, startSuffix] = start.split(' ');
  const [, endSuffix] = end.split(' ');
  return startSuffix === endSuffix ? `${startTime}–${end}` : `${start}–${end}`;
}
