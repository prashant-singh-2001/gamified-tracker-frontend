import type { ActivitySuggestion } from '@/lib/api/errors';
import { CATEGORY_ICON } from '@/lib/utils/category';
import type { Category } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

type SuggestionChipsProps = {
  requestedName: string;
  suggestions: readonly ActivitySuggestion[];
  onPick: (name: string) => void;
};

/** "Did you mean…?" — shown when the typed name matched nothing well enough to auto-resolve. */
export function SuggestionChips({ requestedName, suggestions, onPick }: SuggestionChipsProps) {
  return (
    <div
      role="group"
      aria-label="Did you mean"
      className="flex flex-col gap-2 rounded-xl border border-line-strong bg-surface-2 p-3"
    >
      <p className="text-sm text-soft">
        We couldn&apos;t find <strong className="text-text">{requestedName}</strong>.{' '}
        {suggestions.length > 0 ? 'Did you mean…?' : 'Pick one from the list instead.'}
      </p>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => {
            const Icon = CATEGORY_ICON[s.category as Category] ?? CATEGORY_ICON.OTHER;
            return (
              <button
                key={s.name}
                type="button"
                disabled={!s.active}
                onClick={() => onPick(s.name)}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-[15px] font-medium transition',
                  s.active
                    ? 'text-text hover:border-accent hover:text-accent'
                    : 'cursor-not-allowed text-faint',
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {s.name}
                {!s.active && <span className="text-xs">(inactive)</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
