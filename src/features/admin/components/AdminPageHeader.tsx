import type { ReactNode } from 'react';

type AdminPageHeaderProps = {
  title: string;
  /** One line under the title; also read out when it changes (e.g. how many are waiting). */
  description?: ReactNode;
  /** The page's one primary action, if it has one. */
  action?: ReactNode;
};

/** The top of an admin page: dense, with the title smaller than the app's and one action at most. */
export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-display text-5xl leading-[0.9] font-extrabold">{title}</h1>
        {description && (
          <p className="text-soft" aria-live="polite">
            {description}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}
