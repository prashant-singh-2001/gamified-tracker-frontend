import { cn } from '@/lib/utils/cn';
import { useCatalog } from '@/features/activities/api';
import { RANGES } from '../filters';
import type { HistoryFilters as Filters, HistoryRange } from '../types';

const RANGE_LABEL: Record<string, string> = {
  all: 'All time',
  '7': '7 days',
  '30': '30 days',
  '90': '90 days',
};

type HistoryFiltersProps = {
  filters: Filters;
  onChange: (next: Filters) => void;
};

/** One activity (or all) and how far back to look, both applied by the server. */
export function HistoryFilters({ filters, onChange }: HistoryFiltersProps) {
  const catalog = useCatalog();
  const activities = [...(catalog.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <label className="flex items-center gap-2 text-sm text-muted">
        <span className="shrink-0">Activity</span>
        <select
          value={filters.activityId ?? ''}
          onChange={(e) =>
            onChange({ ...filters, activityId: e.target.value ? Number(e.target.value) : null })
          }
          className="min-h-11 min-w-0 flex-1 rounded-full border border-line-strong bg-surface px-4 text-[15px] text-text"
        >
          <option value="">All activities</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
          {filters.activityId !== null && !activities.some((a) => a.id === filters.activityId) && (
            <option value={filters.activityId}>Activity #{filters.activityId}</option>
          )}
        </select>
      </label>

      <div role="radiogroup" aria-label="How far back" className="flex flex-wrap gap-1.5">
        {RANGES.map((range) => {
          const selected = filters.range === range;
          return (
            <button
              key={range}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ ...filters, range: range as HistoryRange })}
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
    </div>
  );
}
