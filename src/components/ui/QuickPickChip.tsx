import { Link } from 'react-router';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

type QuickPickChipProps = {
  to: string;
  label: string;
  icon?: LucideIcon;
  className?: string;
};

/** 44px chip that jumps straight into logging a specific activity. */
export function QuickPickChip({ to, label, icon: Icon, className }: QuickPickChipProps) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-full border border-accent-ink/25 bg-accent-ink/10 px-4 text-[15px] font-medium text-accent-ink no-underline transition hover:bg-accent-ink/20',
        className,
      )}
    >
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {label}
    </Link>
  );
}
