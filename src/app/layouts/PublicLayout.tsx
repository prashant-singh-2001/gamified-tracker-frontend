import { Link, Outlet, useLocation } from 'react-router';
import { Logo } from '@/components/Logo';
import { useAuthStore } from '@/lib/auth/authStore';
import { homeFor } from '@/lib/auth/redirect';
import { GITHUB_URL } from '@/lib/constants';

export default function PublicLayout() {
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();
  // The auth card carries its own Log in / Sign up switch.
  const onAuthCard = pathname === '/login' || pathname === '/register';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-4 px-6 py-6">
        <Logo />
        <nav aria-label="Main" className="flex flex-wrap items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center px-3 text-[15px] text-soft no-underline hover:text-text"
          >
            GitHub
          </a>
          {user ? (
            <Link
              to={homeFor(user.role)}
              className="flex min-h-11 items-center rounded-full border border-line-strong px-[18px] text-[15px] font-medium no-underline hover:bg-surface-2"
            >
              Open app
            </Link>
          ) : onAuthCard ? null : (
            <Link
              to="/login"
              className="flex min-h-11 items-center rounded-full border border-line-strong px-[18px] text-[15px] font-medium no-underline hover:bg-surface-2"
            >
              Log in
            </Link>
          )}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mx-auto w-full max-w-[1240px] px-6 py-8 text-sm text-faint">
        Etram — free &amp; open source.
      </footer>
    </div>
  );
}
