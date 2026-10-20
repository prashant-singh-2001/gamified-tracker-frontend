import { Link } from 'react-router';
import { Bell } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useMyRank } from '@/features/ranks/api';
import { useUnreadCount } from '@/features/notifications/api';
import { useMe } from '@/lib/auth/useMe';
import { useHideOnScroll } from '@/lib/hooks/useHideOnScroll';
import { cn } from '@/lib/utils/cn';
import { formatGreetingDate, greetingFor } from '@/lib/utils/greeting';
import { AvatarMenu } from './AvatarMenu';

/** Greeting and date, level chip, notification bell with unread badge, account menu. */
export function FloatingNav() {
  const hidden = useHideOnScroll();
  const rank = useMyRank();
  const unread = useUnreadCount().data ?? 0;
  const firstName = useMe().data?.firstName ?? null;
  const now = new Date();

  return (
    <header
      className={cn(
        'sticky top-3 z-40 mx-3 mt-3 flex items-center justify-between gap-4 rounded-[20px] border border-line bg-surface/80 px-3 py-1 backdrop-blur-md transition-transform duration-200',
        hidden && '-translate-y-[calc(100%+1rem)]',
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        {/* The rail carries the logo on desktop. */}
        <div className="lg:hidden">
          <Logo to="/app" />
        </div>
        <p className="hidden min-w-0 truncate text-[15px] md:block">
          <span className="font-medium">
            {greetingFor(now)}
            {firstName ? `, ${firstName}` : ''}
          </span>
          <span className="text-muted"> · {formatGreetingDate(now)}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {rank.data && (
          <span
            className="rounded-full border border-accent/50 px-3 py-1 font-mono text-xs font-bold text-accent"
            aria-label={`Level ${rank.data.overallLevel}`}
          >
            Lv {rank.data.overallLevel}
          </span>
        )}
        <Link
          to="/app/notifications"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
          className="relative grid size-11 place-items-center rounded-xl text-soft hover:text-text"
        >
          <Bell className="size-5" aria-hidden="true" />
          {unread > 0 && (
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1 grid min-w-5 place-items-center rounded-full bg-accent px-1 font-mono text-[11px] leading-5 font-bold text-accent-ink"
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>
        <AvatarMenu />
      </div>
    </header>
  );
}
