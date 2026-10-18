import { Link, NavLink, Outlet } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Logo } from '@/components/Logo';
import { cn } from '@/lib/utils/cn';

const ADMIN_NAV = [
  { to: '/admin/review', label: 'Review queue' },
  { to: '/admin/catalog', label: 'Activity catalog' },
  { to: '/admin/leveling', label: 'Leveling rules' },
  { to: '/admin/system', label: 'System tools' },
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2 md:px-8">
          <div className="flex items-center gap-3">
            <Logo to="/admin" />
            <Badge tone="rank">ADMIN</Badge>
          </div>
          <Link
            to="/app"
            className="flex min-h-11 items-center gap-2 text-[15px] text-soft no-underline hover:text-text"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to app
          </Link>
        </div>
        <nav
          aria-label="Admin"
          className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 md:px-8"
        >
          {ADMIN_NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 shrink-0 items-center border-b-2 px-3 text-[15px] font-medium no-underline',
                  isActive
                    ? 'border-accent text-text'
                    : 'border-transparent text-muted hover:text-text',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
        <Outlet />
      </main>
    </div>
  );
}
