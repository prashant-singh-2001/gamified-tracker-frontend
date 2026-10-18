import { screen } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it } from 'vitest';
import { Link, useLocation } from 'react-router';
import { renderRoutes, signIn } from '@/test/helpers';
import { useAuthStore } from './authStore';
import { RedirectIfAuthed } from './RedirectIfAuthed';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';
import { homeFor, safeNext } from './redirect';

function LoginProbe() {
  const { search } = useLocation();
  return <p>login page {search}</p>;
}

const routes = [
  {
    path: '/',
    element: <RedirectIfAuthed />,
    children: [{ index: true, element: <p>landing</p> }],
  },
  { path: '/login', element: <LoginProbe /> },
  {
    path: '/app',
    element: <RequireAuth />,
    children: [{ index: true, element: <Link to="/app">user area</Link> }],
  },
  {
    path: '/admin',
    element: <RequireRole role="ADMIN" />,
    children: [{ index: true, element: <p>admin area</p> }],
  },
];

describe('RequireAuth', () => {
  it('sends anonymous visitors to /login with a next target', async () => {
    useAuthStore.getState().clear();
    renderRoutes(routes, '/app');
    expect(await screen.findByText(/login page/)).toHaveTextContent('?next=%2Fapp');
  });

  it('renders the page for a logged-in user', async () => {
    signIn(1, 'USER');
    renderRoutes(routes, '/app');
    expect(await screen.findByText('user area')).toBeInTheDocument();
  });

  it('shows a loading skeleton, not the page, while the session is restoring', () => {
    renderRoutes(routes, '/app');
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByText('user area')).not.toBeInTheDocument();
  });

  it('reacts when the session ends', async () => {
    signIn(1, 'USER');
    renderRoutes(routes, '/app');
    await screen.findByText('user area');
    act(() => useAuthStore.getState().clear());
    expect(await screen.findByText(/login page/)).toBeInTheDocument();
  });
});

describe('RequireRole', () => {
  it('shows a 403 page (no redirect) to a regular user', async () => {
    signIn(1, 'USER');
    const { router } = renderRoutes(routes, '/admin');
    expect(await screen.findByText(/403/)).toBeInTheDocument();
    expect(screen.queryByText('admin area')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/admin');
  });

  it('lets an admin through', async () => {
    signIn(2, 'ADMIN');
    renderRoutes(routes, '/admin');
    expect(await screen.findByText('admin area')).toBeInTheDocument();
  });

  it('sends anonymous visitors to /login', async () => {
    useAuthStore.getState().clear();
    renderRoutes(routes, '/admin');
    expect(await screen.findByText(/login page/)).toHaveTextContent('?next=%2Fadmin');
  });
});

describe('RedirectIfAuthed', () => {
  it('shows the landing page to visitors', async () => {
    useAuthStore.getState().clear();
    renderRoutes(routes, '/');
    expect(await screen.findByText('landing')).toBeInTheDocument();
  });

  it('forwards a logged-in user to their dashboard', async () => {
    signIn(1, 'USER');
    const { router } = renderRoutes(routes, '/');
    await screen.findByText('user area');
    expect(router.state.location.pathname).toBe('/app');
  });
});

describe('redirect helpers', () => {
  it('routes admins and users to their homes', () => {
    expect(homeFor('ADMIN')).toBe('/admin');
    expect(homeFor('USER')).toBe('/app');
  });

  it('only accepts same-origin paths as next targets', () => {
    expect(safeNext('/app/history')).toBe('/app/history');
    expect(safeNext('https://evil.example')).toBeNull();
    expect(safeNext('//evil.example')).toBeNull();
    expect(safeNext('/\\evil.example')).toBeNull();
    expect(safeNext(null)).toBeNull();
  });
});
