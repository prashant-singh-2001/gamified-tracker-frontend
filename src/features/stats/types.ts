import type { Category } from '@/lib/api/types';

export type DailyXp = {
  /** `YYYY-MM-DD`, bucketed by the log's start time (UTC day). */
  date: string;
  totalXpEarned: number;
  totalDurationMinutes: number;
};

/**
 * `GET /api/activitylog/analytics/user/{userId}/weekly-report?mode=calendar`.
 * Monday to Sunday (UTC), always seven days: days after today are present with zero XP. The change
 * compares the same weekdays of the previous week.
 */
export type WeeklyReport = {
  currentWeekXp: number;
  previousWeekXp: number;
  percentageChange: number;
  totalActiveMinutes: number;
  topCategory: Category | null;
  dailyBreakdown: DailyXp[];
  mode?: 'ROLLING' | 'CALENDAR';
  /** First and last day shown, and the window `previousWeekXp` covers (`YYYY-MM-DD`). */
  periodStart?: string;
  periodEnd?: string;
  previousPeriodStart?: string;
  previousPeriodEnd?: string;
};

/** `GET .../category-summary`: all-time totals, only for categories that have logs. */
export type CategoryTotal = {
  category: Category;
  totalDurationMinutes: number;
  totalXpEarned: number;
  totalSessions: number;
};

/** One of the 24 hourly buckets of `best-time-of-day`. `hour` is 0-23 in UTC, not local time. */
export type HourBucket = {
  hour: number;
  totalDurationMinutes: number;
  totalXpEarned: number;
  totalSessions: number;
};

/** `GET .../best-time-of-day`: `bestHour` and the category fields are null until there is XP. */
export type BestTime = {
  hourlyBreakdown: HourBucket[];
  bestHour: number | null;
  bestCategory: Category | null;
  bestCategoryHour: number | null;
};
