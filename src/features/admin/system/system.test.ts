import { describe, expect, it } from 'vitest';
import type { LevelTracker } from '@/features/activities/types';
import { AWARD_CAP, awardErrors, byTotalXp, hasErrors, searchTrackers } from './system';

const tracker = (userId: number, totalXp: number, activityId = 1): LevelTracker => ({
  userId,
  activityId,
  level: 1,
  totalXp,
  currentLevelXp: 0,
  xpForNextLevel: 0,
  progressPercent: 0,
  leveledUp: false,
});

describe('byTotalXp', () => {
  it('puts the most XP first, then the lower user id', () => {
    const rows = [tracker(3, 100), tracker(1, 500), tracker(2, 500)];
    expect(byTotalXp(rows).map((r) => r.userId)).toEqual([1, 2, 3]);
  });

  it('does not change the list it was given', () => {
    const rows = [tracker(1, 1), tracker(2, 2)];
    byTotalXp(rows);
    expect(rows.map((r) => r.userId)).toEqual([1, 2]);
  });
});

describe('searchTrackers', () => {
  const rows = [tracker(42, 1), tracker(142, 1), tracker(7, 1), tracker(420, 1)];

  it('keeps every row for a blank search', () => {
    expect(searchTrackers(rows, '  ')).toHaveLength(4);
  });

  it('finds users whose id contains what was typed', () => {
    expect(searchTrackers(rows, '42').map((r) => r.userId)).toEqual([42, 142, 420]);
    expect(searchTrackers(rows, '7').map((r) => r.userId)).toEqual([7]);
  });

  it('reads "#42" and "User 42" like 42', () => {
    expect(searchTrackers(rows, '#42')).toHaveLength(3);
    expect(searchTrackers(rows, 'User 42')).toHaveLength(3);
  });

  it('finds nothing for an id nobody has', () => {
    expect(searchTrackers(rows, '999')).toEqual([]);
  });
});

describe('awardErrors', () => {
  const ok = { user: '42', activityId: 11, xp: '500' };

  it('has none for a good award, a blank user (yourself) and the very top of the cap', () => {
    expect(hasErrors(awardErrors(ok))).toBe(false);
    expect(hasErrors(awardErrors({ ...ok, user: '' }))).toBe(false);
    expect(hasErrors(awardErrors({ ...ok, xp: String(AWARD_CAP) }))).toBe(false);
    expect(hasErrors(awardErrors({ ...ok, xp: '0' }))).toBe(false);
  });

  it('wants a whole-number user', () => {
    for (const user of ['abc', '4.5', '-3', '0']) {
      expect(awardErrors({ ...ok, user }).user).toMatch(/user number/);
    }
  });

  it('wants an activity', () => {
    expect(awardErrors({ ...ok, activityId: null }).activityId).toBe('Choose an activity');
  });

  it('wants XP between 0 and the cap', () => {
    expect(awardErrors({ ...ok, xp: '' }).xp).toBe('Enter how much XP to award');
    expect(awardErrors({ ...ok, xp: 'lots' }).xp).toBe('Enter how much XP to award');
    expect(awardErrors({ ...ok, xp: '-1' }).xp).toBe('XP cannot be negative');
    expect(awardErrors({ ...ok, xp: '10001' }).xp).toBe('At most 10,000 XP per award');
  });
});
