import { useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { BellOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/toastStore';
import { useCatalog } from '@/features/activities/api';
import { cn } from '@/lib/utils/cn';
import { useMarkAllRead, useMarkRead, useNotifications, useUnreadCount } from '../api';
import { NotificationRow } from '../components/NotificationRow';
import type { LevelUpEvent } from '../types';

const VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
] as const;

/**
 * Your level-ups, newest first. Tapping one marks it read and opens that activity's detail. The view lives in the URL: `?show=unread`.
 */
export default function NotificationsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const unreadOnly = params.get('show') === 'unread';

  const list = useNotifications(unreadOnly);
  const unread = useUnreadCount();
  const catalog = useCatalog();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  const names = useMemo(
    () => new Map((catalog.data ?? []).map((a) => [a.id, a.name])),
    [catalog.data],
  );
  const unreadCount = unread.data ?? 0;

  function open(event: LevelUpEvent) {
    if (!event.read) markRead.mutate(event.id);
    void navigate(`/app/activities/${event.activityId}`);
  }

  function readAll() {
    markAll.mutate(undefined, {
      onSuccess: (updated) =>
        toast.success(updated === 1 ? 'Marked 1 as read' : `Marked ${updated} as read`),
      onError: () => toast.error("Couldn't mark them as read. Try again."),
    });
  }

  function show(view: 'all' | 'unread') {
    void navigate(view === 'unread' ? '/app/notifications?show=unread' : '/app/notifications', {
      replace: true,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[clamp(3.5rem,7vw,6rem)] leading-[0.88] font-extrabold">
          Notifications
        </h1>
        <p className="text-lg text-soft" aria-live="polite">
          {unread.isSuccess
            ? unreadCount > 0
              ? `${unreadCount} new ${unreadCount === 1 ? 'level-up' : 'level-ups'}.`
              : "You're all caught up."
            : 'Your level-ups, newest first.'}
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="radiogroup" aria-label="Show" className="flex gap-1.5">
          {VIEWS.map((view) => {
            const selected = (view.id === 'unread') === unreadOnly;
            return (
              <button
                key={view.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => show(view.id)}
                className={cn(
                  'min-h-11 rounded-full border px-5 text-[15px] font-medium',
                  selected
                    ? 'border-text bg-text text-bg'
                    : 'border-line-strong text-soft hover:border-text hover:text-text',
                )}
              >
                {view.label}
              </button>
            );
          })}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="secondary"
            className="rounded-full"
            loading={markAll.isPending}
            onClick={readAll}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {list.isPending ? (
        <div role="status" aria-label="Loading notifications" className="flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : list.isError ? (
        <ErrorPanel
          error={list.error}
          title="Couldn't load notifications"
          onRetry={() => void list.refetch()}
        />
      ) : list.data.length === 0 ? (
        unreadOnly ? (
          <EmptyState
            icon={BellOff}
            title="You're all caught up"
            description="New level-ups will show up here."
          />
        ) : (
          <EmptyState
            icon={BellOff}
            title="No level-ups yet"
            description="Your first one is closer than you think."
            action={
              <Link to="/app/log" className={buttonClass('primary', 'lg')}>
                Log activity
              </Link>
            }
          />
        )
      ) : (
        <ul className="flex flex-col gap-3">
          {list.data.map((event) => (
            <li key={event.id}>
              <NotificationRow
                event={event}
                activityName={names.get(event.activityId) ?? null}
                onOpen={open}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
