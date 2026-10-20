import { describe, expect, it } from 'vitest';
import { isStreakAlive, loggedToday } from './streaks';
import type { Streak } from './types';

const streak = (overrides: Partial<Streak> = {}): Streak => ({
  activityId: 1,
  currentStreak: 4,
  longestStreak: 9,
  lastActivityDate: '2026-10-19',
  active: true,
  ...overrides,
});

describe('streak liveness', () => {
  it('trusts the flag the API sends', () => {
    expect(isStreakAlive(streak({ active: true }))).toBe(true);
    expect(isStreakAlive(streak({ active: false, lastActivityDate: '2026-10-10' }))).toBe(false);
  });

  it('is not alive when the count is zero, whatever the flag says', () => {
    expect(isStreakAlive(streak({ currentStreak: 0 }))).toBe(false);
  });

  it('knows whether today is already logged', () => {
    expect(loggedToday(streak({ lastActivityDate: '2026-10-19' }), '2026-10-19')).toBe(true);
    expect(loggedToday(streak({ lastActivityDate: '2026-10-18' }), '2026-10-19')).toBe(false);
    expect(loggedToday(streak({ lastActivityDate: null }), '2026-10-19')).toBe(false);
  });
});
