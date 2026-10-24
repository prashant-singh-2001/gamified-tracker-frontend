import type { ActivityLogResponse } from '@/features/log-activity/types';

/** `GET /api/activitylog/user/{id}` with any of page, size, sort, activityId, from, to. */
export type LogPage = {
  content: ActivityLogResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  sort: string;
};

/** How far back History looks: all time, the last N days, or dates picked by hand. */
export type HistoryRange = 'all' | 7 | 30 | 90 | 'custom';

/** How the list is ordered. The two date sorts keep the trail; the other two rank the logs. */
export type HistorySort = 'newest' | 'oldest' | 'xp' | 'longest';

export type HistoryFilters = {
  /** One activity, or null for all of them. */
  activityId: number | null;
  range: HistoryRange;
  /** `YYYY-MM-DD` bounds, only for a custom range (either may be open). */
  from: string | null;
  to: string | null;
  sort: HistorySort;
};

export const NO_FILTERS: HistoryFilters = {
  activityId: null,
  range: 'all',
  from: null,
  to: null,
  sort: 'newest',
};
