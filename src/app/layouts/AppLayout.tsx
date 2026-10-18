import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import {
  Bell,
  ChartColumn,
  CirclePlus,
  Ellipsis,
  History,
  House,
  LogOut,
  Mountain,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Modal } from '@/components/ui/Modal';
import { useLogout } from '@/features/auth/api';
import { useAuthStore } from '@/lib/auth/authStore';
import { cn } from '@/lib/utils/cn';

type NavItem = { to: string; label: string; icon: LucideIcon; end?: boolean };

/** The four destinations that get a slot in the phone tab bar (the fifth slot is "More"). */
const PRIMARY: NavItem[] = [
  { to: '/app', label: 'Today', icon: House, end: true },
  { to: '/app/log', label: 'Log', icon: CirclePlus },
  { to: '/app/ranks', label: 'Ranks', icon: Mountain },
  { to: '/app/stats', label: 'Stats', icon: ChartColumn },
];

const SECONDARY: NavItem[] = [
  { to: '/app/history', label: 'History', icon: History },
  { to: '/app/coach', label: 'Weekly coach', icon: Sparkles },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
];

const linkBase =
  'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium no-underline transition';

function sideLinkClass({ isActive }: { isActive: boolean }) {
  return cn(linkBase, isActive ? 'bg-surface-2 text-accent' : 'text-soft hover:text-text');
}

function tabLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium no-underline',
    isActive ? 'text-accent' : 'text-muted',
  );
}

export default function AppLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');
  const logout = useLogout();

  return (
    <div className="min-h-screen md:grid md:grid-cols-[15rem_1fr]">
      {/* Desktop side nav */}
      <aside className="hidden border-r border-line bg-surface md:sticky md:top-0 md:flex md:h-screen md:flex-col md:gap-6 md:p-4">
        <div className="flex items-center justify-between">
          <Logo to="/app" />
          <Link
            to="/app/notifications"
            aria-label="Notifications"
            className="grid size-11 place-items-center rounded-xl text-soft hover:text-text"
          >
            <Bell className="size-5" aria-hidden="true" />
          </Link>
        </div>
        <nav aria-label="App" className="flex flex-1 flex-col gap-1">
          {[...PRIMARY, ...SECONDARY].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={sideLinkClass}>
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={sideLinkClass}>
              <ShieldCheck className="size-5" aria-hidden="true" />
              Admin
            </NavLink>
          )}
        </nav>
        <button
          type="button"
          onClick={logout}
          className={cn(linkBase, 'text-soft hover:text-text')}
        >
          <LogOut className="size-5" aria-hidden="true" />
          Log out
        </button>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Phone top bar */}
        <header className="flex items-center justify-between border-b border-line px-4 py-1 md:hidden">
          <Logo to="/app" />
          <Link
            to="/app/notifications"
            aria-label="Notifications"
            className="grid size-11 place-items-center rounded-xl text-soft hover:text-text"
          >
            <Bell className="size-5" aria-hidden="true" />
          </Link>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-6 pb-28 md:px-8 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Phone bottom tab bar */}
      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-surface md:hidden"
      >
        {PRIMARY.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={tabLinkClass}>
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted"
        >
          <Ellipsis className="size-5" aria-hidden="true" />
          More
        </button>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <ul className="flex flex-col gap-1">
          {SECONDARY.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={() => setMoreOpen(false)}
                className={cn(linkBase, 'text-soft hover:text-text')}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
          {isAdmin && (
            <li>
              <Link
                to="/admin"
                onClick={() => setMoreOpen(false)}
                className={cn(linkBase, 'text-soft hover:text-text')}
              >
                <ShieldCheck className="size-5" aria-hidden="true" />
                Admin
              </Link>
            </li>
          )}
          <li>
            <button
              type="button"
              onClick={logout}
              className={cn(linkBase, 'w-full text-soft hover:text-text')}
            >
              <LogOut className="size-5" aria-hidden="true" />
              Log out
            </button>
          </li>
        </ul>
      </Modal>
    </div>
  );
}
