import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils/cn';

export function Card({ className, ...rest }: ComponentProps<'div'>) {
  return (
    <div className={cn('rounded-[20px] border border-line bg-surface p-6', className)} {...rest} />
  );
}
