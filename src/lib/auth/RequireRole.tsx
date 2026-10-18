import { Outlet } from 'react-router';
import ForbiddenPage from '@/app/pages/ForbiddenPage';
import type { Role } from '@/lib/api/types';
import { useAuthStore } from './authStore';
import { RequireAuth } from './RequireAuth';

function RoleGate({ role }: { role: Role }) {
  const userRole = useAuthStore((s) => s.user?.role);
  // A 403 page rather than a redirect, so a USER hitting /admin can never loop.
  return userRole === role ? <Outlet /> : <ForbiddenPage />;
}

/** Layout guard: logged in AND holding `role`. Anonymous visitors go to /login first. */
export function RequireRole({ role }: { role: Role }) {
  return (
    <RequireAuth>
      <RoleGate role={role} />
    </RequireAuth>
  );
}
