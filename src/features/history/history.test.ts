import { describe, expect, it } from 'vitest';
import type { ActivityLogResponse, ReviewStatus } from '@/features/log-activity/types';
import {
  customRangeError,
  filtersFromParams,
  filtersToSearch,
  isFiltered,
  isRanked,
  rangeDates,
  rangeStart,
  SORT_PARAM,
} from './filters';
import { groupByDay } from './group';

function log(
  id: number,
  startTime: string,
  xpEarned: number,
  reviewStatus: ReviewStatus = 'CLEARED',
): ActivityLogResponse {
  return {
    id,
    userId: 7,
    activity: {
      id: 1,
      name: 'Running',
      category: 'HEALTH',
      xpMultiplier: 1,
      active: true,
      description: null,
      createdAt: '2026-10-01T00:00:00',
    },
    startTime,
    endTime: startTime,
    durationMinutes: 30,
    xpEarned,
    notes: null,
    createdAt: startTime,
    bonusApplied: false,
    bonusMultiplier: 1,
    leveledUp: false,
    currentStreak: 1,
    streakMultiplier: 1,
    reviewStatus,
    nameResolution: null,
  };
}

const base = {
  activityId: null,
  range: 'all' as const,
  from: null,
  to: null,
  sort: 'newest' as const,
};
const read = (query: string) => filtersFromParams(new URLSearchParams(query));

describe('filters in the URL', () => {
  it('reads the activity and the range', () => {
    expect(read('activity=12&range=30')).toEqual({ ...base, activityId: 12, range: 30 });
  });

  it('falls back to the defaults for anything unreadable', () => {
    expect(read('activity=abc&range=45&sort=sideways')).toEqual(base);
    expect(read('activity=-3')).toEqual(base);
    expect(read('')).toEqual(base);
  });

  it('reads each sort', () => {
    expect(read('sort=oldest').sort).toBe('oldest');
    expect(read('sort=xp').sort).toBe('xp');
    expect(read('sort=longest').sort).toBe('longest');
  });

  it('reads a custom range, and treats any date as custom', () => {
    expect(read('range=custom&from=2026-10-01&to=2026-10-15')).toEqual({
      ...base,
      range: 'custom',
      from: '2026-10-01',
      to: '2026-10-15',
    });
    expect(read('from=2026-10-01')).toMatchObject({
      range: 'custom',
      from: '2026-10-01',
      to: null,
    });
    expect(read('range=custom')).toMatchObject({ range: 'custom', from: null, to: null });
  });

  it('ignores dates that are not real days, and dates outside a custom range', () => {
    expect(read('range=custom&from=2026-13-45&to=yesterday')).toMatchObject({
      range: 'custom',
      from: null,
      to: null,
    });
    expect(read('range=30&from=')).toMatchObject({ range: 30, from: null });
  });

  it('writes only what is not the default, and round-trips', () => {
    expect(filtersToSearch(base)).toBe('');
    expect(filtersToSearch({ ...base, activityId: 12 })).toBe('?activity=12');
    expect(filtersToSearch({ ...base, sort: 'xp' })).toBe('?sort=xp');
    const filters = { ...base, activityId: 12, range: 90 as const, sort: 'longest' as const };
    expect(read(filtersToSearch(filters).slice(1))).toEqual(filters);
    const custom = { ...base, range: 'custom' as const, from: '2026-10-01', to: '2026-10-15' };
    expect(filtersToSearch(custom)).toBe('?range=custom&from=2026-10-01&to=2026-10-15');
    expect(read(filtersToSearch(custom).slice(1))).toEqual(custom);
    expect(filtersToSearch({ ...base, range: 'custom' })).toBe('?range=custom');
  });

  it('counts an activity or a range as a filter, but not the sort', () => {
    expect(isFiltered({ ...base, activityId: 12 })).toBe(true);
    expect(isFiltered({ ...base, range: 'custom' })).toBe(true);
    expect(isFiltered({ ...base, sort: 'xp' })).toBe(false);
    expect(isFiltered(base)).toBe(false);
  });
});

describe('sorting', () => {
  it('sends the API sort for each choice', () => {
    expect(SORT_PARAM).toEqual({
      newest: 'startTime,desc',
      oldest: 'startTime,asc',
      xp: 'xpEarned,desc',
      longest: 'durationMinutes,desc',
    });
  });

  it('ranks by XP and length, and keeps the trail for the date sorts', () => {
    expect(isRanked('xp')).toBe(true);
    expect(isRanked('longest')).toBe(true);
    expect(isRanked('newest')).toBe(false);
    expect(isRanked('oldest')).toBe(false);
  });
});

describe('rangeStart', () => {
  const now = new Date('2026-10-20T12:00:00Z');

  it('includes today, so 7 days starts six days back', () => {
    expect(rangeStart(7, now)).toBe('2026-10-14');
    expect(rangeStart(30, now)).toBe('2026-09-21');
    expect(rangeStart(90, now)).toBe('2026-07-23');
  });

  it('sends no date for all time or a custom range', () => {
    expect(rangeStart('all', now)).toBeUndefined();
    expect(rangeStart('custom', now)).toBeUndefined();
  });
});

describe('rangeDates', () => {
  const now = new Date('2026-10-20T12:00:00Z');

  it('sends only `from` for a preset, and nothing for all time', () => {
    expect(rangeDates({ range: 7, from: null, to: null }, now)).toEqual({ from: '2026-10-14' });
    expect(rangeDates({ range: 'all', from: null, to: null }, now)).toEqual({});
  });

  it('sends what a custom range picked, either end open', () => {
    expect(rangeDates({ range: 'custom', from: '2026-10-01', to: '2026-10-15' }, now)).toEqual({
      from: '2026-10-01',
      to: '2026-10-15',
    });
    expect(rangeDates({ range: 'custom', from: '2026-10-01', to: null }, now)).toEqual({
      from: '2026-10-01',
      to: undefined,
    });
  });

  it('never sends a day after today', () => {
    expect(rangeDates({ range: 'custom', from: '2026-10-25', to: '2026-12-01' }, now)).toEqual({
      from: '2026-10-20',
      to: '2026-10-20',
    });
  });
});

describe('customRangeError', () => {
  it('wants the end on or after the start', () => {
    expect(customRangeError('2026-10-15', '2026-10-01')).toBe(
      'The end date must be on or after the start date',
    );
    expect(customRangeError('2026-10-15', '2026-10-15')).toBeNull();
    expect(customRangeError('2026-10-01', '2026-10-15')).toBeNull();
  });

  it('is fine with either end left open', () => {
    expect(customRangeError('2026-10-15', null)).toBeNull();
    expect(customRangeError(null, '2026-10-01')).toBeNull();
    expect(customRangeError(null, null)).toBeNull();
  });
});

describe('groupByDay', () => {
  // Asia/Kolkata is UTC+5:30. "now" is Tue 20 Oct, 11:00 local.
  const now = new Date('2026-10-20T05:30:00Z');

  it('labels Today and Yesterday, then the date', () => {
    const groups = groupByDay(
      [
        log(1, '2026-10-20T03:00:00', 50), // 08:30 today
        log(2, '2026-10-19T05:00:00', 40), // yesterday
        log(3, '2026-10-16T05:00:00', 30),
      ],
      now,
    );
    expect(groups.map((g) => g.label)).toEqual(['Today', 'Yesterday', 'Fri, Oct 16']);
  });

  it('puts a late-evening log on the local day it happened, not the UTC day', () => {
    // 20:00 UTC on the 19th is 01:30 IST on the 20th, so it belongs to Today.
    const groups = groupByDay(
      [log(1, '2026-10-19T20:00:00', 25), log(2, '2026-10-19T05:00:00', 5)],
      now,
    );
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ label: 'Today', xp: 25 });
    expect(groups[1]).toMatchObject({ label: 'Yesterday', xp: 5 });
  });

  it('totals only the XP that counted', () => {
    const [group] = groupByDay(
      [
        log(1, '2026-10-20T03:00:00', 100, 'CLEARED'),
        log(2, '2026-10-20T02:00:00', 50, 'APPROVED'),
        log(3, '2026-10-20T01:00:00', 120, 'FLAGGED'),
        log(4, '2026-10-20T00:30:00', 80, 'REJECTED'),
      ],
      now,
    );
    expect(group?.logs).toHaveLength(4);
    expect(group?.xp).toBe(150);
  });

  it('keeps one group when a day continues across pages', () => {
    const page1 = [log(1, '2026-10-20T03:00:00', 10), log(2, '2026-10-20T02:00:00', 10)];
    const page2 = [log(3, '2026-10-20T01:00:00', 10), log(4, '2026-10-19T05:00:00', 10)];
    const groups = groupByDay([...page1, ...page2], now);
    expect(groups.map((g) => [g.label, g.logs.length])).toEqual([
      ['Today', 3],
      ['Yesterday', 1],
    ]);
  });

  it('is empty for no logs', () => {
    expect(groupByDay([], now)).toEqual([]);
  });
});
