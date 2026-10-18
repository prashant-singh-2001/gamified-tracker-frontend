import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from './authStore';
import { homeFor } from './redirect';

/** For the public landing page: a logged-in visitor goes straight to their dashboard. */
export function RedirectIfAuthed() {
  const user = useAuthStore((s) => s.user);
  return user ? <Navigate to={homeFor(user.role)} replace /> : <Outlet />;
}
