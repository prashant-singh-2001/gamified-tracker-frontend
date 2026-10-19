/** Time handling for the Log Activity form: "how long" + "ended when" → a start and end. */

export type EndedPreset = 'now' | 'hourAgo' | 'morning' | 'custom';

export const ENDED_OPTIONS: ReadonlyArray<{ id: EndedPreset; label: string }> = [
  { id: 'now', label: 'Just now' },
  { id: 'hourAgo', label: '1 hour ago' },
  { id: 'morning', label: 'This morning' },
  { id: 'custom', label: 'Pick time' },
];

export const DURATION_STEP = 15;
export const DURATION_CHIPS = [15, 30, 60, 90] as const;
export const MIN_DURATION = 1;
export const MAX_DURATION = 1440; // the backend rejects single sessions longer than a day

const MINUTE = 60_000;
/**
 * "Just now" ends a few seconds in the past. The API validates `@PastOrPresent` against the
 * server's clock, so a browser clock a little ahead of the server would otherwise be rejected.
 */
const NOW_SKEW_MS = 15_000;
/** Custom times may be at most this far ahead of the browser clock before we call them "future". */
const FUTURE_TOLERANCE_MS = MINUTE;

/** `datetime-local` value (`YYYY-MM-DDTHH:mm`, local wall clock) → Date, or null if invalid. */
export function parseDateTimeLocal(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, y, mo, d, h, mi] = match.map(Number) as [number, number, number, number, number, number];
  const date = new Date(y, mo - 1, d, h, mi);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Date → `datetime-local` value in local time. */
export function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** When the session ended, or null for a custom time that can't be parsed. */
export function resolveEnd(
  preset: EndedPreset,
  custom: string,
  now: Date = new Date(),
): Date | null {
  switch (preset) {
    case 'now':
      return new Date(now.getTime() - NOW_SKEW_MS);
    case 'hourAgo':
      return new Date(now.getTime() - 60 * MINUTE);
    case 'morning': {
      const eleven = new Date(now);
      eleven.setHours(11, 0, 0, 0);
      // Before 11:00 "this morning" is still going on, so it just means now.
      return eleven.getTime() <= now.getTime() ? eleven : new Date(now.getTime() - NOW_SKEW_MS);
    }
    case 'custom':
      return parseDateTimeLocal(custom);
  }
}

export function isFuture(end: Date, now: Date = new Date()): boolean {
  return end.getTime() > now.getTime() + FUTURE_TOLERANCE_MS;
}

/** Start = end − duration. */
export function rangeFor(end: Date, durationMinutes: number): { start: Date; end: Date } {
  return { start: new Date(end.getTime() - durationMinutes * MINUTE), end };
}

export function clampDuration(minutes: number): number {
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, Math.round(minutes)));
}

/** Whole minutes between two instants. */
export function minutesBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MINUTE);
}
