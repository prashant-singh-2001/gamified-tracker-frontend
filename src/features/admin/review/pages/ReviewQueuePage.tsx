import { useState, type KeyboardEvent } from 'react';
import { Check, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { SidePanel } from '@/components/ui/SidePanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/toastStore';
import { toApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils/cn';
import { formatDuration, formatTimeRange, formatXp } from '@/lib/utils/format';
import { fromServerDateTime } from '@/lib/utils/serverTime';
import { AdminPageHeader } from '../../components/AdminPageHeader';
import { pendingCount, useDecide, useFlaggedQueue } from '../api';
import { SessionPanel } from '../components/SessionPanel';
import type { Decision, ReviewItem } from '../types';
import { severityShare, whyFlagged } from '../verdict';

const isFlagged = (item: ReviewItem) => item.activityLog.reviewStatus === 'FLAGGED';

/**
 * Every row of this queue changes someone's XP, so each one shows the evidence next to its
 * buttons. Triage from the keyboard: arrows to move, A to approve, R then Enter to reject.
 */
export default function ReviewQueuePage() {
  const queue = useFlaggedQueue();
  const decide = useDecide();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [panelId, setPanelId] = useState<number | null>(null);

  const items = queue.data ?? [];
  const waiting = pendingCount(items);
  const pending = items.filter(isFlagged);
  const active = activeId ?? pending[0]?.activityLog.id ?? null;

  function nextPendingAfter(id: number): number | null {
    const at = items.findIndex((i) => i.activityLog.id === id);
    const after = items.slice(at + 1).find(isFlagged) ?? items.slice(0, at).find(isFlagged);
    return after?.activityLog.id ?? null;
  }

  function submit(id: number, decision: Decision) {
    setRejectingId(null);
    const next = nextPendingAfter(id);
    decide.mutate(
      { id, decision },
      {
        onSuccess: () => setActiveId(next),
        onError: (err) => {
          if (toApiError(err).status === 409) {
            toast.info('That session was already decided.');
            void queue.refetch();
          } else {
            toast.error("Couldn't save that decision. Try again.");
          }
        },
      },
    );
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (e.metaKey || e.ctrlKey || e.altKey || target.matches('input, textarea, select')) return;
    const at = pending.findIndex((i) => i.activityLog.id === active);

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      const next = pending[Math.min(pending.length - 1, Math.max(0, at + step))];
      if (next) {
        setActiveId(next.activityLog.id);
        setRejectingId(null);
      }
    } else if (e.key.toLowerCase() === 'a' && active !== null) {
      e.preventDefault();
      submit(active, 'approve');
    } else if (e.key.toLowerCase() === 'r' && active !== null) {
      e.preventDefault();
      setRejectingId(active);
    } else if (e.key === 'Enter' && rejectingId !== null && target.tagName !== 'BUTTON') {
      e.preventDefault();
      submit(rejectingId, 'reject');
    } else if (e.key === 'Escape' && rejectingId !== null) {
      setRejectingId(null);
    }
  }

  const panelItem = items.find((i) => i.activityLog.id === panelId);

  return (
    <div>
      <AdminPageHeader
        title="Review queue"
        description={
          queue.isSuccess
            ? waiting > 0
              ? `${waiting} ${waiting === 1 ? 'session waits' : 'sessions wait'} for a decision.`
              : 'Queue clear. No sessions need review.'
            : 'Unusually long sessions are held until you decide.'
        }
        action={
          queue.isSuccess && items.length > waiting ? (
            <Button
              variant="secondary"
              loading={queue.isFetching}
              onClick={() => void queue.refetch()}
            >
              Refresh queue
            </Button>
          ) : undefined
        }
      />

      {queue.isPending ? (
        <div role="status" aria-label="Loading the review queue" className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : queue.isError ? (
        <ErrorPanel
          error={queue.error}
          title="Couldn't load the review queue"
          onRetry={() => void queue.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Queue clear" description="No sessions need review." />
      ) : (
        <>
          <p id="review-help" className="mb-3 text-sm text-muted">
            Move with ↑ and ↓. Press A to approve, or R and then Enter to reject.
          </p>
          <div
            role="group"
            aria-label="Flagged sessions"
            aria-describedby="review-help"
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="overflow-x-auto rounded-2xl border border-line bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text"
          >
            <table className="w-full min-w-[56rem] border-collapse text-left text-[15px]">
              <caption className="sr-only">Flagged sessions, newest first</caption>
              <thead>
                <tr className="border-b border-line text-sm text-muted">
                  <th scope="col" className="px-4 py-3 font-medium">
                    User
                  </th>
                  <th scope="col" className="px-2 py-3 font-medium">
                    Activity
                  </th>
                  <th scope="col" className="px-2 py-3 font-medium">
                    Duration
                  </th>
                  <th scope="col" className="px-2 py-3 font-medium">
                    Logged
                  </th>
                  <th scope="col" className="px-2 py-3 text-right font-medium">
                    XP on hold
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Why it was flagged
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    <span className="sr-only">Decision</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const log = item.activityLog;
                  const flagged = isFlagged(item);
                  const why = whyFlagged(item);
                  const share = severityShare(item, items);
                  const isActive = log.id === active && flagged;
                  return (
                    <tr
                      key={log.id}
                      aria-selected={isActive}
                      onClick={() => {
                        setActiveId(log.id);
                        setPanelId(log.id);
                      }}
                      className={cn(
                        'cursor-pointer border-b border-line align-top last:border-0 hover:bg-surface-2',
                        isActive && 'bg-surface-2 outline-2 -outline-offset-2 outline-text',
                        !flagged && 'text-muted',
                      )}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">User #{log.userId}</td>
                      <td className="px-2 py-3 font-medium">{log.activity.name}</td>
                      <td className="px-2 py-3 font-mono whitespace-nowrap">
                        {formatDuration(log.durationMinutes)}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        {formatTimeRange(
                          fromServerDateTime(log.startTime),
                          fromServerDateTime(log.endTime),
                        )}
                      </td>
                      <td className="px-2 py-3 text-right font-mono whitespace-nowrap text-pending">
                        {formatXp(log.xpEarned)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{why.headline}</p>
                        <p className={cn('text-sm', why.rough ? 'text-streak' : 'text-muted')}>
                          {why.detail}
                        </p>
                        <span
                          aria-hidden="true"
                          className="mt-1.5 block h-1.5 w-40 rounded-full bg-surface-2"
                        >
                          <span
                            className="block h-full rounded-full bg-text"
                            style={{ width: `${share * 100}%` }}
                          />
                        </span>
                        <span className="sr-only">
                          Severity {Math.round(share * 100)}% of the worst in the queue
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {!flagged ? (
                          <p className="flex items-center gap-2 font-medium" data-testid="decided">
                            {log.reviewStatus === 'APPROVED' ? (
                              <>
                                <Check className="size-4" aria-hidden="true" />
                                Approved, {formatXp(log.xpEarned)} released
                              </>
                            ) : (
                              <>
                                <X className="size-4" aria-hidden="true" />
                                Rejected, no XP awarded
                              </>
                            )}
                          </p>
                        ) : rejectingId === log.id ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-sm">Reject? This session gets no XP.</p>
                            <div className="flex gap-2">
                              <Button
                                variant="danger"
                                loading={decide.isPending}
                                onClick={() => submit(log.id, 'reject')}
                              >
                                Reject
                              </Button>
                              <Button variant="ghost" onClick={() => setRejectingId(null)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              disabled={decide.isPending}
                              onClick={() => submit(log.id, 'approve')}
                              aria-label={`Approve ${log.activity.name} by user ${log.userId}`}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={decide.isPending}
                              onClick={() => {
                                setActiveId(log.id);
                                setRejectingId(log.id);
                              }}
                              aria-label={`Reject ${log.activity.name} by user ${log.userId}`}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <SidePanel
        open={panelItem !== undefined}
        onClose={() => setPanelId(null)}
        title="Review session"
      >
        {panelItem && (
          <SessionPanel
            item={panelItem}
            deciding={decide.isPending}
            onDecide={(d) => submit(panelItem.activityLog.id, d)}
          />
        )}
      </SidePanel>
    </div>
  );
}
