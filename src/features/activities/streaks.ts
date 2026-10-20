import { serverToday } from '@/lib/utils/serverTime';
import type { Streak } from './types';

/** Already logged today (UTC day), so the streak is safe until tomorrow. */
export function loggedToday(streak: Streak, today = serverToday()): boolean {
  return streak.lastActivityDate === today;
}

/**
 * The backend only updates a streak when something is logged, so a stale row still reports its
 * old count. It says itself whether the streak is alive (`active`); only then is the count live.
 */
export function isStreakAlive(streak: Streak): boolean {
  return streak.active && streak.currentStreak > 0;
}
