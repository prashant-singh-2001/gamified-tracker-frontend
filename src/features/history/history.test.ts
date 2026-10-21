import { describe, expect, it } from 'vitest';
import type { ActivityLogResponse, ReviewStatus } from '@/features/log-activity/types';
import { filtersFromParams, filtersToSearch, isFiltered, rangeStart } from './filters';
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

describe('filters in the URL', () => {
  it('reads the activity and the range', () => {
    expect(filtersFromParams(new URLSearchParams('activity=12&range=30'))).toEqual({
      activityId: 12,
      range: 30,
    });
  });

  it('falls back to all for anything unreadable', () => {
    expect(filtersFromParams(new URLSearchParams('activity=abc&range=45'))).toEqual({
      activityId: null,
      range: 'all',
    });
    expect(filtersFromParams(new URLSearchParams('activity=-3'))).toEqual({
      activityId: null,
      range: 'all',
    });
    expect(filtersFromParams(new URLSearchParams(''))).toEqual({ activityId: null, range: 'all' });
  });

  it('writes only what is not "all", and round-trips', () => {
    expect(filtersToSearch({ activityId: null, range: 'all' })).toBe('');
    expect(filtersToSearch({ activityId: 12, range: 'all' })).toBe('?activity=12');
    const filters = { activityId: 12, range: 90 as const };
    expect(filtersFromParams(new URLSearchParams(filtersToSearch(filters)))).toEqual(filters);
    expect(isFiltered(filters)).toBe(true);
    expect(isFiltered({ activityId: null, range: 'all' })).toBe(false);
  });
});

describe('rangeStart', () => {
  const now = new Date('2026-10-20T12:00:00Z');

  it('includes today, so 7 days starts six days back', () => {
    expect(rangeStart(7, now)).toBe('2026-10-14');
    expect(rangeStart(30, now)).toBe('2026-09-21');
    expect(rangeStart(90, now)).toBe('2026-07-23');
  });

  it('sends no date for all time', () => {
    expect(rangeStart('all', now)).toBeUndefined();
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
