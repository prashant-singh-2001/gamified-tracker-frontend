import type { Category } from '@/lib/api/types';

export type DailyXp = {
  /** `YYYY-MM-DD`, bucketed by the log's start time (UTC day). */
  date: string;
  totalXpEarned: number;
  totalDurationMinutes: number;
};

/**
 * `GET /api/activitylog/analytics/user/{userId}/weekly-report`.
 * The "week" is a rolling 7 days ending today (UTC), oldest first — not Mon–Sun.
 */
export type WeeklyReport = {
  currentWeekXp: number;
  previousWeekXp: number;
  percentageChange: number;
  totalActiveMinutes: number;
  topCategory: Category | null;
  dailyBreakdown: DailyXp[];
};
