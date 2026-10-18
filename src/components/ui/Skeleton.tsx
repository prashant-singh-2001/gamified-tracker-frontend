import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils/cn';

/** Placeholder block shown while data loads (use instead of spinners for cards and lists). */
export function Skeleton({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-xl bg-surface-2', className)}
      {...rest}
    />
  );
}

export function CardSkeleton({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5"
    >
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
