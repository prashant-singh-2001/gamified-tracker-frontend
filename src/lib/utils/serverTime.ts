/**
 * The backend runs on UTC and uses zone-less `LocalDateTime`s: it validates `@PastOrPresent`
 * against its own UTC clock and returns UTC wall-clock strings with no offset. Sending local
 * wall-clock time from e.g. IST (UTC+5:30) would put "just now" 5.5 hours in the future and be
 * rejected, so every request time goes out as UTC and every response time is read as UTC.
 */

const pad = (n: number) => String(n).padStart(2, '0');
const HAS_OFFSET = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/** `Date` → `YYYY-MM-DDTHH:mm:ss` as UTC wall-clock time (what the API expects). */
export function toServerDateTime(date: Date): string {
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`
  );
}

/** API `LocalDateTime` string (UTC, no offset) → the real instant. */
export function fromServerDateTime(value: string): Date {
  return new Date(HAS_OFFSET.test(value) ? value : `${value}Z`);
}

/** `Date` → `YYYY-MM-DD` using the UTC calendar day, matching the API's `LocalDate`s. */
export function toServerDate(date: Date): string {
  return toServerDateTime(date).slice(0, 10);
}

/** The backend's idea of "today" (UTC calendar day), used for streak and week-strip checks. */
export function serverToday(now: Date = new Date()): string {
  return toServerDate(now);
}

export function formatLocalTime(value: string): string {
  return fromServerDateTime(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** "8:00 AM – 9:30 AM" in the viewer's local time. */
export function formatLocalRange(start: string, end: string): string {
  return `${formatLocalTime(start)} – ${formatLocalTime(end)}`;
}
