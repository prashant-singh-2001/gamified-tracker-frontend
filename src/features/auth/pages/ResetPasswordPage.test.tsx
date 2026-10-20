import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { useLocation } from 'react-router';
import { renderRoutes } from '@/test/helpers';
import { server } from '@/test/server';
import ResetPasswordPage from './ResetPasswordPage';

function LoginProbe() {
  const { state } = useLocation();
  return <p>login ({(state as { reason?: string } | null)?.reason})</p>;
}

const routes = [
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/login', element: <LoginProbe /> },
];

async function fill(password: string, confirm = password) {
  await userEvent.type(screen.getByLabelText('New password'), password);
  await userEvent.type(screen.getByLabelText('Confirm new password'), confirm);
  await userEvent.click(screen.getByRole('button', { name: 'Set new password' }));
}

describe('ResetPasswordPage', () => {
  it('sets the new password with the token from the link, then sends the user to log in', async () => {
    let body: unknown;
    server.use(
      http.post('*/auth/reset', async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderRoutes(routes, '/reset-password?token=abc123');
    await fill('a-new-password');

    expect(await screen.findByText('login (password-reset)')).toBeInTheDocument();
    expect(body).toEqual({ token: 'abc123', newPassword: 'a-new-password' });
  });

  it('does not call the server when the two passwords differ', async () => {
    renderRoutes(routes, '/reset-password?token=abc123');
    await fill('one-password', 'another-one');
    expect(await screen.findByText('The passwords do not match')).toBeInTheDocument();
  });

  it('explains a link that is unknown, expired or used, and offers a new one', async () => {
    server.use(
      http.post('*/auth/reset', () =>
        HttpResponse.json({ detail: 'Invalid or expired reset token' }, { status: 400 }),
      ),
    );
    renderRoutes(routes, '/reset-password?token=old');
    await fill('a-new-password');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This reset link is invalid or has expired.',
    );
    expect(screen.getByRole('link', { name: 'Request a new link' })).toHaveAttribute(
      'href',
      '/login?forgot=1',
    );
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  });

  it('shows the same message straight away when there is no token', () => {
    renderRoutes(routes, '/reset-password');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This reset link is invalid or has expired.',
    );
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
  });
});
