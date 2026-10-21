import { cn } from '@/lib/utils/cn';
import { timeAgo } from '@/lib/utils/format';
import { fromServerDateTime } from '@/lib/utils/serverTime';
import type { LevelUpEvent } from '../types';

type NotificationRowProps = {
  event: LevelUpEvent;
  /** The activity's name, or null while it is not known. */
  activityName: string | null;
  onOpen: (event: LevelUpEvent) => void;
};

/** The old level small, the new one large: the climb is the first thing you read. */
function LevelBadge({ from, to }: { from: number; to: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex w-24 shrink-0 items-baseline justify-center gap-1.5 font-display leading-none"
    >
      <span className="text-xl font-bold text-muted">{from}</span>
      <span className="text-lg text-muted">→</span>
      <span className="text-5xl font-extrabold">{to}</span>
    </span>
  );
}

/** One level-up. Unread rows carry a dot (and say so for screen readers) and a raised surface. */
export function NotificationRow({ event, activityName, onOpen }: NotificationRowProps) {
  const name = activityName ?? `Activity #${event.activityId}`;
  return (
    <button
      type="button"
      onClick={() => onOpen(event)}
      className={cn(
        'relative flex min-h-20 w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors hover:bg-surface-2',
        event.read ? 'border-line bg-bg' : 'border-line-strong bg-surface',
      )}
    >
      {!event.read && (
        <span
          aria-hidden="true"
          data-testid="unread-dot"
          className="absolute top-3 left-3 size-2.5 rounded-full bg-accent"
        />
      )}
      <LevelBadge from={event.oldLevel} to={event.newLevel} />
      <span className="flex min-w-0 flex-1 flex-col">
        {!event.read && <span className="sr-only">Unread. </span>}
        <span className="truncate font-bold">
          Level {event.newLevel} in {name}
        </span>
        <span className="text-sm text-muted">
          <span className="sr-only">Up from level {event.oldLevel}. </span>
          {timeAgo(fromServerDateTime(event.createdAt))}
        </span>
      </span>
    </button>
  );
}
