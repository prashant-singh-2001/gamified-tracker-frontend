import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { profileStorage } from '@/lib/auth/profileStorage';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import { FloatingNav } from './FloatingNav';

function renderNav(userId = 7) {
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
    http.get('*/api/notifications/unread-count', () => HttpResponse.json({ count: 3 })),
  );
  return renderRoutes([{ path: '/app', element: <FloatingNav /> }], '/app');
}

describe('top bar greeting', () => {
  it('greets by name and date when this browser knows the name for this user', async () => {
    profileStorage.set({ userId: 7, firstName: 'Prashant' });
    renderNav(7);

    expect(
      await screen.findByText(/Good (morning|afternoon|evening), Prashant/),
    ).toBeInTheDocument();
    expect(screen.getByText(/· \w{3} \d{1,2} \w{3}/)).toBeInTheDocument();
  });

  it("never shows another account's name", async () => {
    profileStorage.set({ userId: 99, firstName: 'Someone' });
    renderNav(7);

    expect(await screen.findByText(/Good (morning|afternoon|evening)/)).toBeInTheDocument();
    expect(screen.queryByText(/Someone/)).not.toBeInTheDocument();
  });

  it('just greets, without a comma or a made-up name, when no name is known', async () => {
    renderNav(7);

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
