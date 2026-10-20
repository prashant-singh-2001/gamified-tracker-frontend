import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Role } from '@/lib/api/types';
import { useAuthStore } from '@/lib/auth/authStore';
import { profileStorage } from '@/lib/auth/profileStorage';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { makeAccessToken, renderRoutes } from '@/test/helpers';
import { server } from '@/test/server';
import AuthPage from './AuthPage';

const routes = [
  {
    element: <AuthPage />,
    children: [{ path: '/login' }, { path: '/register' }],
  },
  { path: '/app', element: <p>user home</p> },
  { path: '/app/history', element: <p>history</p> },
  { path: '/admin', element: <p>admin home</p> },
];

/** Only the face that is up is exposed to the accessibility tree, so queries scope to it. */
const loginFace = () => within(screen.getByRole('region', { name: 'Welcome back' }));
const signupFace = () => within(screen.getByRole('region', { name: 'Start your climb' }));

function loginReturns(role: Role) {
  server.use(
    http.post('*/auth/login', () =>
      HttpResponse.json({ accessToken: makeAccessToken(9, role), refreshToken: 'refresh-token' }),
    ),
  );
}

async function fillLogin() {
  await userEvent.type(loginFace().getByLabelText('Email'), 'ada@example.com');
  await userEvent.type(loginFace().getByLabelText('Password'), 'secret');
  await userEvent.click(loginFace().getByRole('button', { name: 'Log in' }));
}

async function fillSignup() {
  const face = signupFace();
  await userEvent.type(face.getByLabelText('First name'), '  Ada ');
  await userEvent.type(face.getByLabelText('Last name'), 'Lovelace');
  await userEvent.type(face.getByLabelText('Email'), 'ada@example.com');
  await userEvent.type(face.getByLabelText('Password'), 'secret');
  await userEvent.click(face.getByRole('button', { name: 'Start at Basecamp' }));
}

describe('AuthPage: log in face', () => {
  it('validates the form before calling the API', async () => {
    renderRoutes(routes, '/login');
    await userEvent.click(loginFace().getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('logs a user in, stores the session and lands on /app', async () => {
    loginReturns('USER');
    renderRoutes(routes, '/login');
    await fillLogin();

    expect(await screen.findByText('user home')).toBeInTheDocument();
    expect(useAuthStore.getState().user).toEqual({ id: 9, role: 'USER' });
    expect(tokenStorage.getRefreshToken()).toBe('refresh-token');
  });

  it('sends admins to /admin', async () => {
    loginReturns('ADMIN');
    renderRoutes(routes, '/login');
    await fillLogin();
    expect(await screen.findByText('admin home')).toBeInTheDocument();
  });

  it('returns to the ?next page after login', async () => {
    loginReturns('USER');
    renderRoutes(routes, '/login?next=%2Fapp%2Fhistory');
    await fillLogin();
    expect(await screen.findByText('history')).toBeInTheDocument();
  });

  it('ignores an off-site ?next target', async () => {
    loginReturns('USER');
    renderRoutes(routes, '/login?next=%2F%2Fevil.example');
    await fillLogin();
    expect(await screen.findByText('user home')).toBeInTheDocument();
  });

  it('shows one message above the form for bad credentials and stays on the face', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ detail: 'Invalid email or password' }, { status: 401 }),
      ),
    );
    const { router } = renderRoutes(routes, '/login');
    await fillLogin();

    expect(await loginFace().findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(useAuthStore.getState().user).toBeNull();
    expect(router.state.location.pathname).toBe('/login');
  });

  it('says the session ended when sent here by an expired session', () => {
    const { router } = renderRoutes(routes, '/login');
    void router.navigate('/login', { state: { reason: 'session-ended' }, replace: true });
    return screen.findByText('Your session ended, please log in again.');
  });

  it('has no forgot-password link, since the backend has no such endpoint', () => {
    renderRoutes(routes, '/login');
    expect(screen.queryByText(/forgot/i)).not.toBeInTheDocument();
  });
});

describe('AuthPage: sign up face', () => {
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
    await fillSignup();

    expect(await screen.findByText('user home')).toBeInTheDocument();
    expect(profileStorage.get()).toEqual({ userId: 12, firstName: 'Ada' });
  });

  it('shows the server message and stores nothing when sign-up fails', async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json({ detail: 'Too many attempts' }, { status: 429 }),
      ),
    );
    const { router } = renderRoutes(routes, '/register');
    await fillSignup();

    expect(await signupFace().findByRole('alert')).toHaveTextContent('Too many attempts');
    expect(profileStorage.get()).toBeNull();
    expect(router.state.location.pathname).toBe('/register');
  });

  it('reads a bare 500 as a possible duplicate email and offers to log in instead', async () => {
    server.use(http.post('*/auth/register', () => new HttpResponse(null, { status: 500 })));
    renderRoutes(routes, '/register');
    await fillSignup();

    expect(await signupFace().findByRole('alert')).toHaveTextContent(
      'If this email is already registered, log in instead.',
    );
    await userEvent.click(signupFace().getByRole('button', { name: 'Log in instead' }));

    expect(loginFace().getByLabelText('Email')).toHaveValue('ada@example.com');
  });

  it('hints at password strength without blocking the form', async () => {
    renderRoutes(routes, '/register');
    const password = signupFace().getByLabelText('Password');

    await userEvent.type(password, 'abc');
    expect(signupFace().getByRole('status')).toHaveTextContent('Weak');
    await userEvent.clear(password);
    await userEvent.type(password, 'Correct-horse-9');
    expect(signupFace().getByRole('status')).toHaveTextContent('Strong');
  });

  it('shows and hides the password', async () => {
    renderRoutes(routes, '/register');
    const password = signupFace().getByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');

    await userEvent.click(signupFace().getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    await userEvent.click(signupFace().getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});

describe('AuthPage: the flip', () => {
  it('turns the card and swaps the URL with replace, keeping ?next', async () => {
    const { router } = renderRoutes(routes, '/login?next=%2Fapp%2Fhistory');
    await userEvent.click(loginFace().getByRole('button', { name: 'Create an account' }));

    expect(router.state.location.pathname).toBe('/register');
    expect(router.state.location.search).toBe('?next=%2Fapp%2Fhistory');
    expect(signupFace().getByRole('heading', { name: 'Start your climb' })).toBeInTheDocument();
    // replace: Back must leave the page, not go back to the other face
    expect(router.state.historyAction).toBe('REPLACE');

    await userEvent.click(signupFace().getByRole('button', { name: 'Log in' }));
    expect(router.state.location.pathname).toBe('/login');
  });

  it('puts only the face that is up in front of assistive tech and the tab order', async () => {
    renderRoutes(routes, '/login');
    const faces = document.querySelectorAll('.flip-face');
    const [front, back] = Array.from(faces);

    expect(front).not.toHaveAttribute('inert');
    expect(front).toHaveAttribute('aria-hidden', 'false');
    expect(back).toHaveAttribute('inert');
    expect(back).toHaveAttribute('aria-hidden', 'true');

    await userEvent.click(loginFace().getByRole('button', { name: 'Create an account' }));
    expect(front).toHaveAttribute('inert');
    expect(back).not.toHaveAttribute('inert');
  });

  it('carries the typed email across, in both directions', async () => {
    renderRoutes(routes, '/login');
    await userEvent.type(loginFace().getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(loginFace().getByRole('button', { name: 'Create an account' }));
    expect(signupFace().getByLabelText('Email')).toHaveValue('ada@example.com');

    await userEvent.clear(signupFace().getByLabelText('Email'));
    await userEvent.type(signupFace().getByLabelText('Email'), 'grace@example.com');
    await userEvent.click(signupFace().getByRole('button', { name: 'Log in' }));
    expect(loginFace().getByLabelText('Email')).toHaveValue('grace@example.com');
  });

  it('moves focus to the first field of the face that came up', async () => {
    renderRoutes(routes, '/login');
    await userEvent.click(loginFace().getByRole('button', { name: 'Create an account' }));
    expect(signupFace().getByLabelText('First name')).toHaveFocus();

    await userEvent.click(signupFace().getByRole('button', { name: 'Log in' }));
    expect(loginFace().getByLabelText('Email')).toHaveFocus();
  });

  it('never flips because of an error', async () => {
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ detail: 'Invalid email or password' }, { status: 401 }),
      ),
    );
    const { router } = renderRoutes(routes, '/login');
    await fillLogin();
    await loginFace().findByRole('alert');
    expect(router.state.location.pathname).toBe('/login');
  });
});
