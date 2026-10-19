import { describe, expect, it } from 'vitest';
import { isStreakAlive, loggedToday } from './streaks';
import type { Streak } from './types';

const streak = (lastActivityDate: string | null, currentStreak = 4): Streak => ({
  activityId: 1,
  currentStreak,
  longestStreak: 9,
  lastActivityDate,
});

const TODAY = '2026-10-19';

describe('streak liveness', () => {
  it('is alive when last extended today or yesterday', () => {
    expect(isStreakAlive(streak('2026-10-19'), TODAY)).toBe(true);
    expect(isStreakAlive(streak('2026-10-18'), TODAY)).toBe(true);
  });

  it('is dead once a full day was missed, even though the backend still reports the count', () => {
    expect(isStreakAlive(streak('2026-10-17'), TODAY)).toBe(false);
    expect(isStreakAlive(streak('2026-09-01', 12), TODAY)).toBe(false);
  });

  it('handles month boundaries when finding yesterday', () => {
    expect(isStreakAlive(streak('2026-09-30'), '2026-10-01')).toBe(true);
  });

  it('ignores empty or never-logged streaks', () => {
    expect(isStreakAlive(streak(null), TODAY)).toBe(false);
    expect(isStreakAlive(streak('2026-10-19', 0), TODAY)).toBe(false);
  });

  it('knows whether today is already logged', () => {
    expect(loggedToday(streak('2026-10-19'), TODAY)).toBe(true);
    expect(loggedToday(streak('2026-10-18'), TODAY)).toBe(false);
  });
});
