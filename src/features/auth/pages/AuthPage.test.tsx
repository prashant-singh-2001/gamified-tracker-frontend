import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Role } from '@/lib/api/types';
import { useAuthStore } from '@/lib/auth/authStore';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { makeAccessToken, renderRoutes } from '@/test/helpers';
import { server } from '@/test/server';
import AuthPage from './AuthPage';

const routes = [
  {
    element: <AuthPage />,
    children: [
      { path: '/login', element: <></> },
      { path: '/register', element: <></> },
    ],
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

  it('opens the reset view with the typed email and answers the same way for any address', async () => {
    let body: unknown;
    server.use(
      http.post('*/auth/forgot', async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { message: 'If an account exists for that email, a reset link has been sent.' },
          { status: 202 },
        );
      }),
    );
    renderRoutes(routes, '/login');
    await userEvent.type(loginFace().getByLabelText('Email'), 'ada@example.com');
    await userEvent.click(loginFace().getByRole('button', { name: 'Forgot password?' }));

    const reset = within(screen.getByRole('region', { name: 'Reset your password' }));
    expect(reset.getByLabelText('Email')).toHaveValue('ada@example.com');
    await userEvent.click(reset.getByRole('button', { name: 'Send reset link' }));

    expect(await reset.findByRole('status')).toHaveTextContent(
      'If an account exists for ada@example.com, a reset link is on its way. It works for 30 minutes.',
    );
    expect(body).toEqual({ email: 'ada@example.com' });

    await userEvent.click(reset.getByRole('button', { name: 'Back to log in' }));
    expect(loginFace().getByLabelText('Email')).toBeInTheDocument();
  });

  it('opens the reset view straight away from ?forgot=1 (the "request a new link" target)', () => {
    renderRoutes(routes, '/login?forgot=1');
    expect(screen.getByRole('region', { name: 'Reset your password' })).toBeInTheDocument();
  });

  it('checks the email before asking the server', async () => {
    renderRoutes(routes, '/login?forgot=1');
    const reset = within(screen.getByRole('region', { name: 'Reset your password' }));
    await userEvent.click(reset.getByRole('button', { name: 'Send reset link' }));
    expect(await reset.findByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('says so after a password was changed', () => {
    const { router } = renderRoutes(routes, '/login');
    void router.navigate('/login', { state: { reason: 'password-reset' }, replace: true });
    return screen.findByText('Password changed. Log in with your new password.');
  });
});

describe('AuthPage: sign up face', () => {
  it('signs up and lands on /app', async () => {
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
    expect(useAuthStore.getState().user).toEqual({ id: 12, role: 'USER' });
  });

  it('shows the server message and stays signed out when sign-up fails', async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json({ detail: 'Too many attempts' }, { status: 429 }),
      ),
    );
    const { router } = renderRoutes(routes, '/register');
    await fillSignup();

    expect(await signupFace().findByRole('alert')).toHaveTextContent('Too many attempts');
    expect(useAuthStore.getState().user).toBeNull();
    expect(router.state.location.pathname).toBe('/register');
  });

  it('puts a duplicate email under the Email field and offers to log in instead', async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json({ status: 409, detail: 'Email already registered' }, { status: 409 }),
      ),
    );
    renderRoutes(routes, '/register');
    await fillSignup();

    expect(
      await signupFace().findByText('An account with this email already exists.'),
    ).toBeVisible();
    expect(signupFace().getAllByRole('alert')).toHaveLength(1); // only the field message
    await userEvent.click(signupFace().getByRole('button', { name: 'Log in instead' }));

    expect(loginFace().getByLabelText('Email')).toHaveValue('ada@example.com');
  });

  it("shows the server's per-field messages under each field, not above the form", async () => {
    server.use(
      http.post('*/auth/register', () =>
        HttpResponse.json(
          {
            status: 400,
            detail: 'email should be formatted and required; password is required',
            errors: {
              email: 'email should be formatted and required',
              password: 'password is required',
            },
          },
          { status: 400 },
        ),
      ),
    );
    renderRoutes(routes, '/register');
    await fillSignup();

    const email = signupFace().getByLabelText('Email');
    await waitFor(() => expect(email).toHaveAccessibleDescription(/should be formatted/));
    expect(signupFace().getByLabelText('Password')).toHaveAccessibleDescription(
      'password is required',
    );
    expect(email).toBeInvalid();
    // the joined `detail` is not repeated as a second, form-level message
    expect(signupFace().queryByText(/email should be formatted and required; password/)).toBeNull();
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

  it('changes the line beside the map with the face', async () => {
    renderRoutes(routes, '/login');
    expect(screen.getByText('Your streak is waiting.')).toBeInTheDocument();

    await userEvent.click(loginFace().getByRole('button', { name: 'Create an account' }));
    expect(screen.getByText('You start at Basecamp.')).toBeInTheDocument();
    expect(screen.getByText('Eight ranks above you.')).toBeInTheDocument();
    expect(screen.queryByText('Your streak is waiting.')).not.toBeInTheDocument();
  });

  it('keeps the route map decorative, with a marker that moves with the face', () => {
    renderRoutes(routes, '/login');
    const map = screen.getByTestId('route-marker').closest('[aria-hidden="true"]');
    expect(map).not.toBeNull();
  });
});
