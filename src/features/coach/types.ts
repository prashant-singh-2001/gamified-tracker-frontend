import type { CategoryTotal, WeeklyReport } from '@/features/stats/types';

/** Why `narrative` is or is not there. The facts are always present whatever this says. */
export type NarrativeStatus = 'GENERATED' | 'DISABLED' | 'UNAVAILABLE';

/** `GET /api/insights/weekly`. Always 200; the week is the rolling last seven days. */
export type WeeklyInsights = {
  /** `YYYY-MM-DD`, first and last day of the week (UTC calendar days). */
  weekStart: string;
  weekEnd: string;
  /** The same numbers `weekly-report` gives for that week, never recomputed. */
  totals: WeeklyReport;
  /** Per category for the week (not all time), only categories that have logs. */
  categories: CategoryTotal[];
  /** Plain text, bounded in length; null unless `narrativeStatus` is GENERATED. */
  narrative: string | null;
  narrativeStatus: NarrativeStatus;
};
