import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatDuration, formatTimeRange, formatXp } from '@/lib/utils/format';
import { fromServerDateTime } from '@/lib/utils/serverTime';
import type { ReviewItem } from '../types';
import { whyFlagged } from '../verdict';

type SessionPanelProps = {
  item: ReviewItem;
  deciding: boolean;
  onDecide: (decision: 'approve' | 'reject') => void;
};

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** The evidence for one flagged session: the log, its notes, and this session against their usual. */
export function SessionPanel({ item, deciding, onDecide }: SessionPanelProps) {
  const log = item.activityLog;
  const why = whyFlagged(item);
  const flagged = log.reviewStatus === 'FLAGGED';
  const longest = Math.max(log.durationMinutes, item.median, 1);
  const bar = (minutes: number) => `${Math.max(2, (minutes / longest) * 100)}%`;

  return (
    <>
      <dl className="grid grid-cols-2 gap-4">
        <Fact label="User">User #{log.userId}</Fact>
        <Fact label="Activity">{log.activity.name}</Fact>
        <Fact label="Logged">
          {formatTimeRange(fromServerDateTime(log.startTime), fromServerDateTime(log.endTime))}
        </Fact>
        <Fact label={flagged ? 'XP on hold' : 'XP'}>
          <span className="font-mono font-bold">{formatXp(log.xpEarned)}</span>
        </Fact>
      </dl>

      <section aria-label="Against their usual" className="flex flex-col gap-3">
        <h3 className="font-medium">{why.headline}</h3>
        <div className="flex flex-col gap-2 font-mono text-sm">
          <div className="flex flex-col gap-1">
            <span className="flex justify-between text-muted">
              <span>Their usual</span>
              <span>{item.median > 0 ? formatDuration(item.median) : 'unknown'}</span>
            </span>
            <span aria-hidden="true" className="h-3 rounded-full bg-surface-2">
              <span
                className="block h-full rounded-full bg-text-faint"
                style={{ width: item.median > 0 ? bar(item.median) : '0%' }}
              />
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="flex justify-between">
              <span>This session</span>
              <span className="font-bold">{formatDuration(log.durationMinutes)}</span>
            </span>
            <span aria-hidden="true" className="h-3 rounded-full bg-surface-2">
              <span
                className="block h-full rounded-full bg-text"
                style={{ width: bar(log.durationMinutes) }}
              />
            </span>
          </div>
        </div>
        <p className={why.rough ? 'text-sm text-streak' : 'text-sm text-muted'}>{why.detail}</p>
      </section>

      {log.notes && (
        <section aria-label="Notes" className="flex flex-col gap-1">
          <h3 className="text-sm text-muted">Notes</h3>
          <p className="whitespace-pre-wrap">{log.notes}</p>
        </section>
      )}

      {flagged ? (
        <div className="mt-auto flex flex-wrap gap-3 border-t border-line pt-4">
          <Button loading={deciding} onClick={() => onDecide('approve')}>
            <Check className="size-4" aria-hidden="true" />
            Approve
          </Button>
          <Button variant="secondary" disabled={deciding} onClick={() => onDecide('reject')}>
            <X className="size-4" aria-hidden="true" />
            Reject
          </Button>
        </div>
      ) : (
        <p className="mt-auto flex items-center gap-3 border-t border-line pt-4">
          <StatusPill status={log.reviewStatus} />
          {log.reviewStatus === 'APPROVED' ? 'XP released.' : 'No XP awarded.'}
        </p>
      )}
    </>
  );
}
