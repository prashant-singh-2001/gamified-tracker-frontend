import type { ActivityLogResponse } from '@/features/log-activity/types';
import { formatNumber } from '@/lib/utils/format';

/** XP as it counted: held XP is grey and on hold, rejected is zero, the rest is earned. */
export function xpText(log: ActivityLogResponse): { text: string; className: string } {
  const xp = formatNumber(Math.round(log.xpEarned));
  switch (log.reviewStatus) {
    case 'FLAGGED':
      return { text: `${xp} XP on hold`, className: 'text-pending' };
    case 'REJECTED':
      return { text: '0 XP', className: 'text-muted' };
    default:
      return { text: `+${xp} XP`, className: 'text-xp' };
  }
}
