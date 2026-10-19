import { useId, useMemo, useState, type KeyboardEvent } from 'react';
import { effectiveMultiplier, type CatalogActivity } from '@/features/activities/types';
import { CATEGORIES, CATEGORY_LABEL } from '@/lib/api/types';
import { CATEGORY_ICON } from '@/lib/utils/category';
import { cn } from '@/lib/utils/cn';

type ActivityPickerProps = {
  value: string;
  onChange: (value: string) => void;
  activities: readonly CatalogActivity[];
  error?: string;
};

/**
 * Searchable select over the catalog, grouped by category (ARIA combobox + listbox).
 * Free text is allowed: the backend resolves near-misses itself and answers with suggestions.
 */
export function ActivityPicker({ value, onChange, activities, error }: ActivityPickerProps) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const groups = useMemo(() => {
    const query = value.trim().toLowerCase();
    const matches = activities.filter((a) => a.name.toLowerCase().includes(query));
    return CATEGORIES.map((category) => ({
      category,
      items: matches
        .filter((a) => a.category === category)
        .sort((a, b) => a.name.localeCompare(b.name)),
    })).filter((g) => g.items.length > 0);
  }, [activities, value]);

  const flat = groups.flatMap((g) => g.items);
  const optionId = (name: string) => `${id}-opt-${name.replace(/\s+/g, '-')}`;
  const current = flat[Math.min(active, flat.length - 1)];

  function select(activity: CatalogActivity) {
    if (!activity.active) return;
    onChange(activity.name);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      if (flat.length === 0) return;
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (Math.min(i, flat.length - 1) + step + flat.length) % flat.length);
    } else if (e.key === 'Enter' && open && current) {
      e.preventDefault(); // pick the highlighted option instead of submitting the form
      select(current);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault(); // close the list only, not the whole sheet
      e.stopPropagation();
      setOpen(false);
    }
  }

  const showList = open && groups.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-soft">
        Activity
      </label>
      <input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && current ? optionId(current.name) : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="off"
        placeholder="Search or type an activity"
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className={cn(
          'min-h-11 rounded-xl border bg-surface-2 px-3.5 text-text placeholder:text-faint',
          error ? 'border-danger' : 'border-line-strong',
        )}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <ul
        id={listId}
        role="listbox"
        aria-label="Activities"
        hidden={!showList}
        className="max-h-56 overflow-y-auto rounded-xl border border-line-strong bg-surface-2 p-1"
      >
        {groups.map(({ category, items }) => {
          const Icon = CATEGORY_ICON[category];
          return (
            <li key={category} role="presentation">
              <ul role="group" aria-label={CATEGORY_LABEL[category]}>
                <li
                  role="presentation"
                  className="flex items-center gap-2 px-3 pt-2 pb-1 font-mono text-xs font-bold tracking-widest text-muted uppercase"
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {CATEGORY_LABEL[category]}
                </li>
                {items.map((a) => (
                  <li
                    key={a.name}
                    id={optionId(a.name)}
                    role="option"
                    aria-selected={a.name === current?.name}
                    aria-disabled={!a.active || undefined}
                    // mouseDown (not click) fires before the input's blur closes the list
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(a);
                    }}
                    className={cn(
                      'flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 text-[15px]',
                      a.name === current?.name && 'bg-surface',
                      !a.active && 'cursor-not-allowed text-faint',
                    )}
                  >
                    <span>
                      {a.name}
                      {!a.active && <span className="text-xs"> (inactive)</span>}
                    </span>
                    <span className="font-mono text-xs text-muted">×{effectiveMultiplier(a)}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
