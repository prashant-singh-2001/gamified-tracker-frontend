import { toServerDate } from '@/lib/utils/serverTime';
import { NO_FILTERS, type HistoryFilters, type HistoryRange, type HistorySort } from './types';

const DAY = 86_400_000;
export const RANGES: readonly HistoryRange[] = ['all', 7, 30, 90, 'custom'];

/** The API's `sort` for each choice. */
export const SORT_PARAM: Record<HistorySort, string> = {
  newest: 'startTime,desc',
  oldest: 'startTime,asc',
  xp: 'xpEarned,desc',
  longest: 'durationMinutes,desc',
};

export const SORT_LABEL: Record<HistorySort, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  xp: 'Most XP',
  longest: 'Longest',
};

/** The two date sorts read as days along the trail; the others are a ranked list. */
export const isRanked = (sort: HistorySort) => sort === 'xp' || sort === 'longest';

const SORTS = Object.keys(SORT_PARAM) as HistorySort[];
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar day as `YYYY-MM-DD`, or null. */
function day(value: string | null): string | null {
  if (!value || !ISO_DAY.test(value)) return null;
  return Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()) ? null : value;
}

/** `?activity=12&range=30&sort=xp&from=…&to=…` → filters. Anything unreadable falls back. */
export function filtersFromParams(params: URLSearchParams): HistoryFilters {
  const activity = Number(params.get('activity'));
  const range = Number(params.get('range'));
  const from = day(params.get('from'));
  const to = day(params.get('to'));
  const sort = params.get('sort') as HistorySort | null;
  const custom = params.get('range') === 'custom' || from !== null || to !== null;
  return {
    activityId: Number.isInteger(activity) && activity > 0 ? activity : null,
    range: custom ? 'custom' : range === 7 || range === 30 || range === 90 ? range : 'all',
    from: custom ? from : null,
    to: custom ? to : null,
    sort: sort && SORTS.includes(sort) ? sort : 'newest',
  };
}

/** Filters → the query string, leaving out anything that is the default. */
export function filtersToSearch(filters: HistoryFilters): string {
  const params = new URLSearchParams();
  if (filters.activityId !== null) params.set('activity', String(filters.activityId));
  if (filters.range === 'custom') {
    params.set('range', 'custom');
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
  } else if (filters.range !== 'all') {
    params.set('range', String(filters.range));
  }
  if (filters.sort !== NO_FILTERS.sort) params.set('sort', filters.sort);
  const text = params.toString();
  return text ? `?${text}` : '';
}

/** Whether anything narrows the list. Sorting only orders it, so it is not a filter. */
export const isFiltered = (filters: HistoryFilters) =>
  filters.activityId !== null || filters.range !== 'all';

/**
 * The first calendar day a preset range includes, as the API's `from` date (inclusive, by the log's
 * start day in UTC). "7 days" is today and the six days before it.
 */
export function rangeStart(range: HistoryRange, now: Date = new Date()): string | undefined {
  if (range === 'all' || range === 'custom') return undefined;
  return toServerDate(new Date(now.getTime() - (range - 1) * DAY));
}

/**
 * The `from` and `to` to send. A preset sends only `from`. A custom range sends what was picked,
 * never later than today (nothing is logged in the future).
 */
export function rangeDates(
  filters: Pick<HistoryFilters, 'range' | 'from' | 'to'>,
  now: Date = new Date(),
): { from?: string; to?: string } {
  if (filters.range !== 'custom') {
    const from = rangeStart(filters.range, now);
    return from ? { from } : {};
  }
  const today = toServerDate(now);
  const clamp = (value: string | null) => (value ? (value > today ? today : value) : undefined);
  return { from: clamp(filters.from), to: clamp(filters.to) };
}

/** What is wrong with a picked range, or null. The end must not come before the start. */
export function customRangeError(from: string | null, to: string | null): string | null {
  return from && to && to < from ? 'The end date must be on or after the start date' : null;
}
