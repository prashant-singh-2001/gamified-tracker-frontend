import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import { FloatingNav } from './FloatingNav';

function renderNav(userId = 7, me: { firstName: string } | null = null) {
  signIn(userId, 'USER');
  server.use(
    http.get('*/api/ranks/me', () =>
      HttpResponse.json({
        tier: 'ALPINE',
        overallLevel: 7,
        totalXp: 100,
        percentile: 0.3,
        position: 3,
        totalUsers: 10,
        updatedAt: '2026-10-19T10:00:00',
      }),
    ),
    http.get('*/users/me', () =>
      me
        ? HttpResponse.json({
            id: userId,
            firstName: me.firstName,
            lastName: 'Singh',
            role: 'USER',
          })
        : HttpResponse.json({ detail: 'User not found' }, { status: 404 }),
    ),
    http.get('*/api/notifications/unread-count', () => HttpResponse.json({ count: 3 })),
  );
  return renderRoutes([{ path: '/app', element: <FloatingNav /> }], '/app');
}

describe('top bar greeting', () => {
  it('greets by name and date, with the name taken from the account', async () => {
    renderNav(7, { firstName: 'Prashant' });

    expect(
      await screen.findByText(/Good (morning|afternoon|evening), Prashant/),
    ).toBeInTheDocument();
    expect(screen.getByText(/· \w{3} \d{1,2} \w{3}/)).toBeInTheDocument();
  });

  it('just greets, without a comma or a made-up name, when the account has none to show', async () => {
    renderNav(7, null);

    const greeting = await screen.findByText(/Good (morning|afternoon|evening)/);
    expect(greeting.textContent).not.toContain(',');
  });

  it('keeps the level chip, the bell with its unread count and the account menu', async () => {
    renderNav(7);

    expect(await screen.findByLabelText('Level 7')).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: 'Notifications, 3 unread' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Account menu' })).toBeInTheDocument();
  });
});
