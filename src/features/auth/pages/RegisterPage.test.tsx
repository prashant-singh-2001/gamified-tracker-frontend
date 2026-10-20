import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { profileStorage } from '@/lib/auth/profileStorage';
import { makeAccessToken, renderRoutes } from '@/test/helpers';
import { server } from '@/test/server';
import RegisterPage from './RegisterPage';

const routes = [
  { path: '/register', element: <RegisterPage /> },
  { path: '/app', element: <p>user home</p> },
];

async function fillAndSubmit() {
  await userEvent.type(screen.getByLabelText('First name'), '  Ada ');
  await userEvent.type(screen.getByLabelText('Last name'), 'Lovelace');
  await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'secret');
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
}

describe('RegisterPage', () => {
  it('signs up, lands on /app and remembers the first name for this user only', async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json({
          accessToken: makeAccessToken(12, 'USER'),
          refreshToken: 'refresh-token',
        }),
      ),
    );
    renderRoutes(routes, '/register');
    await fillAndSubmit();

    expect(await screen.findByText('user home')).toBeInTheDocument();
    expect(profileStorage.get()).toEqual({ userId: 12, firstName: 'Ada' });
  });

  it('stores nothing when sign-up fails', async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json({ detail: 'Email already registered' }, { status: 409 }),
      ),
    );
    renderRoutes(routes, '/register');
    await fillAndSubmit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered');
    expect(profileStorage.get()).toBeNull();
  });
});
