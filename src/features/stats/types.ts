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
