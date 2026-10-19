import { Check, CircleCheck, Clock, X, type LucideIcon } from 'lucide-react';
import type { ReviewStatus } from '@/features/log-activity/types';
import { Badge } from './Badge';

const STATUS: Record<
  ReviewStatus,
  { label: string; icon: LucideIcon; tone: 'neutral' | 'pending' | 'accent' | 'danger' }
> = {
  CLEARED: { label: 'Cleared', icon: CircleCheck, tone: 'neutral' },
  FLAGGED: { label: 'Pending', icon: Clock, tone: 'pending' },
  APPROVED: { label: 'Approved', icon: Check, tone: 'accent' },
  REJECTED: { label: 'Rejected', icon: X, tone: 'danger' },
};

/** Status is never conveyed by colour alone: every pill has an icon and a word. */
export function StatusPill({ status }: { status: ReviewStatus }) {
  const { label, icon: Icon, tone } = STATUS[status];
  return (
    <Badge tone={tone}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </Badge>
  );
}
