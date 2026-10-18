import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Call to action, e.g. a link styled with buttonClass(). */
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      {Icon && <Icon className="size-8 text-muted" aria-hidden="true" />}
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {description && <p className="max-w-md text-soft">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
