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

/** How far back History looks; `all` sends no date. */
export type HistoryRange = 'all' | 7 | 30 | 90;

export type HistoryFilters = {
  /** One activity, or null for all of them. */
  activityId: number | null;
  range: HistoryRange;
};

export const NO_FILTERS: HistoryFilters = { activityId: null, range: 'all' };
