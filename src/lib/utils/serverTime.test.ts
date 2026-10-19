import { describe, expect, it } from 'vitest';
import { fromServerDateTime, serverToday, toServerDate, toServerDateTime } from './serverTime';

describe('server time helpers', () => {
  it('writes the UTC wall clock, whatever the local zone is', () => {
    // 19:00 IST (UTC+5:30) is 13:30 UTC — the API must receive 13:30.
    const instant = new Date('2026-10-19T19:00:00+05:30');
    expect(toServerDateTime(instant)).toBe('2026-10-19T13:30:00');
  });

  it('round-trips an instant through the server format', () => {
    const instant = new Date('2026-10-19T13:30:45Z');
    expect(fromServerDateTime(toServerDateTime(instant)).toISOString()).toBe(
      '2026-10-19T13:30:45.000Z',
    );
  });

  it('reads zone-less API strings as UTC, including fractional seconds', () => {
    expect(fromServerDateTime('2026-10-19T13:26:38').toISOString()).toBe(
      '2026-10-19T13:26:38.000Z',
    );
    expect(fromServerDateTime('2026-10-19T13:26:38.123456').getUTCSeconds()).toBe(38);
  });

  it('leaves strings that already carry an offset alone', () => {
    expect(fromServerDateTime('2026-10-19T13:26:38Z').toISOString()).toBe(
      '2026-10-19T13:26:38.000Z',
    );
    expect(fromServerDateTime('2026-10-19T18:56:38+05:30').toISOString()).toBe(
      '2026-10-19T13:26:38.000Z',
    );
  });

  it('uses the UTC calendar day for "today"', () => {
    // 02:00 on the 20th in IST is still the 19th in UTC.
    const lateNightIst = new Date('2026-10-20T02:00:00+05:30');
    expect(serverToday(lateNightIst)).toBe('2026-10-19');
    expect(toServerDate(lateNightIst)).toBe('2026-10-19');
  });
});
