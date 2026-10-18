import { useId, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export type TabItem<T extends string> = { id: T; label: string };

type TabsProps<T extends string> = {
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** Panel content for the active tab. */
  children: ReactNode;
  label: string;
};

export function Tabs<T extends string>({ tabs, value, onChange, children, label }: TabsProps<T>) {
  const base = useId();

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((t) => t.id === value);
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length];
    if (next) {
      onChange(next.id);
      document.getElementById(`${base}-tab-${next.id}`)?.focus();
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
        className="flex gap-1 border-b border-line"
      >
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              id={`${base}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${base}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                'min-h-11 border-b-2 px-4 text-[15px] font-medium transition',
                selected
                  ? 'border-accent text-text'
                  : 'border-transparent text-muted hover:text-text',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel`}
        aria-labelledby={`${base}-tab-${value}`}
        className="pt-4"
      >
        {children}
      </div>
    </div>
  );
}
