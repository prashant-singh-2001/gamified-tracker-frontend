import { NavLink, Outlet } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/Logo';
import { pendingCount, useFlaggedQueue } from '@/features/admin/review/api';
import { cn } from '@/lib/utils/cn';

const ADMIN_NAV = [
  { to: '/admin/review', label: 'Review queue', badge: true },
  { to: '/admin/catalog', label: 'Activity catalog', badge: false },
  { to: '/admin/leveling', label: 'Leveling rules', badge: false },
  { to: '/admin/system', label: 'System tools', badge: false },
] as const;

/**
 * The admin console: the same paper and ink as the app (and its dark theme), but built for work.
 * A left rail from 1024px, tabs along the top below that, and the accent saved for each page's
 * one primary action. The Review queue carries the number of sessions waiting for a decision.
 */
export default function AdminLayout() {
  const flagged = useFlaggedQueue();
  const waiting = pendingCount(flagged.data);

  const links = ADMIN_NAV.map(({ to, label, badge }) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) =>
        cn(
          'flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-lg px-3 text-[15px] font-medium no-underline',
          isActive ? 'bg-surface-2 text-text' : 'text-muted hover:text-text',
        )
      }
    >
      {label}
      {badge && waiting > 0 && (
        <span
          className="min-w-6 rounded-full bg-text px-1.5 text-center font-mono text-xs leading-6 font-bold text-bg"
          aria-label={`${waiting} waiting`}
        >
          {waiting}
        </span>
      )}
    </NavLink>
  ));

  return (
    <div className="theme-survey theme-auto min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <aside className="hidden flex-col gap-6 border-r border-line bg-surface p-4 lg:flex">
        <div className="flex items-center gap-3">
          <Logo to="/admin" />
          <Badge tone="rank">Admin</Badge>
        </div>
        <nav aria-label="Admin" className="flex flex-col gap-1">
          {links}
        </nav>
        <NavLink
          to="/app"
          className="mt-auto flex min-h-11 items-center gap-2 text-[15px] text-soft no-underline hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Switch to app
        </NavLink>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="border-b border-line bg-surface lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-2">
            <div className="flex items-center gap-3">
              <Logo to="/admin" />
              <Badge tone="rank">Admin</Badge>
            </div>
            <NavLink
              to="/app"
              className="flex min-h-11 items-center gap-2 text-[15px] text-soft no-underline hover:text-text"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Switch to app
            </NavLink>
          </div>
          <nav aria-label="Admin" className="flex gap-1 overflow-x-auto px-3 pb-2">
            {links}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
