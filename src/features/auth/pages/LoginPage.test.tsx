import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Role } from '@/lib/api/types';
import { useAuthStore } from '@/lib/auth/authStore';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { makeAccessToken, renderRoutes } from '@/test/helpers';
import { server } from '@/test/server';
import LoginPage from './LoginPage';

const routes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/app', element: <p>user home</p> },
  { path: '/app/history', element: <p>history</p> },
  { path: '/admin', element: <p>admin home</p> },
];

function loginReturns(role: Role) {
  server.use(
    http.post('*/auth/login', () =>
      HttpResponse.json({ accessToken: makeAccessToken(9, role), refreshToken: 'refresh-token' }),
    ),
  );
}

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'secret');
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
}

describe('LoginPage', () => {
  it('validates the form before calling the API', async () => {
    renderRoutes(routes, '/login');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('logs a user in, stores the session and lands on /app', async () => {
    loginReturns('USER');
    renderRoutes(routes, '/login');
    await fillAndSubmit();

    expect(await screen.findByText('user home')).toBeInTheDocument();
    expect(useAuthStore.getState().user).toEqual({ id: 9, role: 'USER' });
    expect(tokenStorage.getRefreshToken()).toBe('refresh-token');
  });

  it('sends admins to /admin', async () => {
    loginReturns('ADMIN');
    renderRoutes(routes, '/login');
    await fillAndSubmit();
    expect(await screen.findByText('admin home')).toBeInTheDocument();
  });

  it('returns to the ?next page after login', async () => {
    loginReturns('USER');
    renderRoutes(routes, '/login?next=%2Fapp%2Fhistory');
    await fillAndSubmit();
    expect(await screen.findByText('history')).toBeInTheDocument();
  });

  it('ignores an off-site ?next target', async () => {
    loginReturns('USER');
    renderRoutes(routes, '/login?next=%2F%2Fevil.example');
    await fillAndSubmit();
    expect(await screen.findByText('user home')).toBeInTheDocument();
  });

  it('shows the server message for bad credentials', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ detail: 'Invalid email or password' }, { status: 401 }),
      ),
    );
    renderRoutes(routes, '/login');
    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(useAuthStore.getState().user).toBeNull();
  });
});
