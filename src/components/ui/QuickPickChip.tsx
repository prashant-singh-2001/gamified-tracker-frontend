import { Link } from 'react-router';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type QuickPickChipProps = {
  to: string;
  label: string;
  icon?: LucideIcon;
  /** `lg` is a full-width 56px tile for the hero card; `md` is the compact 44px chip. */
  size?: 'md' | 'lg';
  className?: string;
};

/** 44px chip that jumps straight into logging a specific activity. */
export function QuickPickChip({
  to,
  label,
  icon: Icon,
  size = 'md',
  className,
}: QuickPickChipProps) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-2 border border-line-strong bg-surface-2 text-[15px] font-medium text-text no-underline transition hover:border-accent hover:text-accent',
        size === 'lg' ? 'min-h-14 w-full rounded-2xl px-4 text-base' : 'min-h-11 rounded-full px-4',
        className,
      )}
    >
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      <span className="truncate">{label}</span>
    </Link>
  );
}
