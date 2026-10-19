import { serverToday, toServerDate } from '@/lib/utils/serverTime';
import type { Streak } from './types';

function yesterdayOf(today: string): string {
  const d = new Date(`${today}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return toServerDate(d);
}

/** Already logged today (UTC day), so the streak is safe until tomorrow. */
export function loggedToday(streak: Streak, today = serverToday()): boolean {
  return streak.lastActivityDate === today;
}

/**
 * The backend only updates a streak when something is logged and never resets `currentStreak` on
 * a missed day, so a stale row still reports its old count. A streak is genuinely alive only if
 * it was last extended today or yesterday (UTC).
 */
export function isStreakAlive(streak: Streak, today = serverToday()): boolean {
  return (
    streak.currentStreak > 0 &&
    (streak.lastActivityDate === today || streak.lastActivityDate === yesterdayOf(today))
  );
}
