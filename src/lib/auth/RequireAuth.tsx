import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuthStore } from './authStore';
import { loginUrl } from './redirect';

function BootScreen() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

/** Layout guard: renders its children (or the matched child routes) only when logged in. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === 'booting') return <BootScreen />;
  if (status === 'anon') {
    return <Navigate to={loginUrl(location.pathname + location.search)} replace />;
  }
  return children ?? <Outlet />;
}
