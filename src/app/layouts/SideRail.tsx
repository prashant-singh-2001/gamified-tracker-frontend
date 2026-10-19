import { Link, NavLink } from 'react-router';
import { Plus } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { buttonClass } from '@/components/ui/buttonStyles';
import { cn } from '@/lib/utils/cn';
import { RAIL_ITEMS } from './navItems';

/** Desktop navigation (≥1024px): accent Log button on top, then icons + labels. */
export function SideRail() {
  return (
    <aside className="hidden border-r border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:gap-6 lg:p-4">
      <Logo to="/app" />
      <Link to="/app/log" className={buttonClass('primary', 'lg', 'w-full')}>
        <Plus className="size-5" strokeWidth={2.75} aria-hidden="true" />
        Log activity
      </Link>
      <nav aria-label="App" className="flex flex-col gap-1">
        {RAIL_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium no-underline transition',
                isActive ? 'bg-surface-2 text-accent' : 'text-soft hover:text-text',
              )
            }
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
