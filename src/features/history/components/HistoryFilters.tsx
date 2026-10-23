import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { toServerDate } from '@/lib/utils/serverTime';
import { useCatalog } from '@/features/activities/api';
import { customRangeError, RANGES, SORT_LABEL } from '../filters';
import type { HistoryFilters as Filters, HistoryRange, HistorySort } from '../types';

const RANGE_LABEL: Record<string, string> = {
  all: 'All time',
  '7': '7 days',
  '30': '30 days',
  '90': '90 days',
  custom: 'Custom',
};

type HistoryFiltersProps = {
  filters: Filters;
  onChange: (next: Filters) => void;
};

/**
 * From and To dates. The picked values live here until they make sense together, so a half-typed
 * range never reaches the server; an end before the start is explained instead of sent.
 */
function CustomRange({ filters, onChange }: HistoryFiltersProps) {
  const [from, setFrom] = useState(filters.from ?? '');
  const [to, setTo] = useState(filters.to ?? '');
  const today = toServerDate(new Date());
  const error = customRangeError(from || null, to || null);

  function pick(nextFrom: string, nextTo: string) {
    setFrom(nextFrom);
    setTo(nextTo);
    if (!customRangeError(nextFrom || null, nextTo || null)) {
      onChange({ ...filters, from: nextFrom || null, to: nextTo || null });
    }
  }

  const field =
    'min-h-11 rounded-xl border border-line-strong bg-surface px-3 text-[15px] text-text';
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-muted">
        From
        <input
          type="date"
          value={from}
          max={to || today}
          onChange={(e) => pick(e.target.value, to)}
          className={field}
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        To
        <input
          type="date"
          value={to}
          min={from || undefined}
          max={today}
          onChange={(e) => pick(from, e.target.value)}
          className={field}
        />
      </label>
      {error && (
        <p role="alert" className="basis-full text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** One activity, how far back, and the order, all applied by the server. */
export function HistoryFilters({ filters, onChange }: HistoryFiltersProps) {
  const catalog = useCatalog();
  const activities = [...(catalog.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const selectClass =
    'min-h-11 min-w-0 flex-1 rounded-full border border-line-strong bg-surface px-4 text-[15px] text-text';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="shrink-0">Activity</span>
          <select
            value={filters.activityId ?? ''}
            onChange={(e) =>
              onChange({ ...filters, activityId: e.target.value ? Number(e.target.value) : null })
            }
            className={selectClass}
          >
            <option value="">All activities</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
            {filters.activityId !== null &&
              !activities.some((a) => a.id === filters.activityId) && (
                <option value={filters.activityId}>Activity #{filters.activityId}</option>
              )}
          </select>
        </label>

        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="shrink-0">Sort</span>
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as HistorySort })}
            className={selectClass}
          >
            {(Object.keys(SORT_LABEL) as HistorySort[]).map((s) => (
              <option key={s} value={s}>
                {SORT_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div role="radiogroup" aria-label="How far back" className="flex flex-wrap gap-1.5">
        {RANGES.map((range) => {
          const selected = filters.range === range;
          return (
            <button
              key={range}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() =>
                onChange({
                  ...filters,
                  range: range as HistoryRange,
                  // Picked dates belong to Custom only; a preset starts clean.
                  from: range === 'custom' ? filters.from : null,
                  to: range === 'custom' ? filters.to : null,
                })
              }
              className={cn(
                'min-h-11 rounded-full border px-4 text-[15px] font-medium',
                selected
                  ? 'border-text bg-text text-bg'
                  : 'border-line-strong text-soft hover:border-text hover:text-text',
              )}
            >
              {RANGE_LABEL[String(range)]}
            </button>
          );
        })}
      </div>

      {filters.range === 'custom' && <CustomRange filters={filters} onChange={onChange} />}
    </div>
  );
}
