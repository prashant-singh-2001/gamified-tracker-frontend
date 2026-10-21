import { toServerDate } from '@/lib/utils/serverTime';
import { NO_FILTERS, type HistoryFilters, type HistoryRange } from './types';

const DAY = 86_400_000;
export const RANGES: readonly HistoryRange[] = ['all', 7, 30, 90];

/** `?activity=12&range=30` → filters. Anything unreadable falls back to "all". */
export function filtersFromParams(params: URLSearchParams): HistoryFilters {
  const activity = Number(params.get('activity'));
  const range = Number(params.get('range'));
  return {
    activityId: Number.isInteger(activity) && activity > 0 ? activity : null,
    range: range === 7 || range === 30 || range === 90 ? range : 'all',
  };
}

/** Filters → the query string, leaving out anything that is "all". */
export function filtersToSearch(filters: HistoryFilters): string {
  const params = new URLSearchParams();
  if (filters.activityId !== null) params.set('activity', String(filters.activityId));
  if (filters.range !== 'all') params.set('range', String(filters.range));
  const text = params.toString();
  return text ? `?${text}` : '';
}

export const isFiltered = (filters: HistoryFilters) =>
  filters.activityId !== null || filters.range !== NO_FILTERS.range;

/**
 * The first calendar day a range includes, as the API's `from` date (inclusive, by the log's start
 * day in UTC). "7 days" is today and the six days before it.
 */
export function rangeStart(range: HistoryRange, now: Date = new Date()): string | undefined {
  if (range === 'all') return undefined;
  return toServerDate(new Date(now.getTime() - (range - 1) * DAY));
}
