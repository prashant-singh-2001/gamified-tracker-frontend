import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import { Ellipsis, Plus, ShieldCheck } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useAuthStore } from '@/lib/auth/authStore';
import { cn } from '@/lib/utils/cn';
import { MORE_ITEMS, TAB_LEFT, TAB_RIGHT, type NavItem } from './navItems';

const slot =
  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium no-underline';

function Tab({ to, label, icon: Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn(slot, isActive ? 'text-accent' : 'text-muted')}
    >
      <Icon className="size-5" aria-hidden="true" />
      {label}
    </NavLink>
  );
}

const sheetLink =
  'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium text-soft no-underline hover:bg-surface-2 hover:text-text';

/** Phone / tablet navigation: Home · Ranks · [+ Log] · Stats · More. Hidden from 1024px up. */
export function TabBar() {
  const [moreOpen, setMoreOpen] = useState(false);
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  return (
    <>
      <nav
        aria-label="App"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[20px] border border-line bg-surface/90 px-1 backdrop-blur-md lg:hidden"
      >
        {TAB_LEFT.map((item) => (
          <Tab key={item.to} {...item} />
        ))}

        <div className="grid place-items-center">
          <Link
            to="/app/log"
            aria-label="Log activity"
            className="-mt-7 grid size-14 place-items-center rounded-full bg-accent text-accent-ink shadow-lg ring-4 ring-bg transition hover:brightness-110"
          >
            <Plus className="size-7" strokeWidth={2.75} aria-hidden="true" />
          </Link>
        </div>

        {TAB_RIGHT.map((item) => (
          <Tab key={item.to} {...item} />
        ))}

        <button
          type="button"
          onClick={() => setMoreOpen(true)}
          aria-haspopup="dialog"
          className={cn(slot, 'text-muted')}
        >
          <Ellipsis className="size-5" aria-hidden="true" />
          More
        </button>
      </nav>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <ul className="flex flex-col gap-1">
          {MORE_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link to={to} onClick={() => setMoreOpen(false)} className={sheetLink}>
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
          {isAdmin && (
            <li>
              <Link to="/admin" onClick={() => setMoreOpen(false)} className={sheetLink}>
                <ShieldCheck className="size-5" aria-hidden="true" />
                Admin console
              </Link>
            </li>
          )}
        </ul>
      </BottomSheet>
    </>
  );
}
