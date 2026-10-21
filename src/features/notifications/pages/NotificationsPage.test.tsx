import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { useToastStore } from '@/components/ui/toastStore';
import type { CatalogActivity } from '@/features/activities/types';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import type { LevelUpEvent } from '../types';
import NotificationsPage from './NotificationsPage';

const HOUR = 3_600_000;
const iso = (hoursAgo: number) => new Date(Date.now() - hoursAgo * HOUR).toISOString().slice(0, 19);

const event = (id: number, activityId: number, read: boolean, hoursAgo = 1): LevelUpEvent => ({
  id,
  activityId,
  oldLevel: id + 5,
  newLevel: id + 6,
  totalXp: 1000,
  currentLevelXp: 100,
  read,
  createdAt: iso(hoursAgo),
});

const activity = (id: number, name: string): CatalogActivity => ({
  id,
  name,
  category: 'HEALTH',
  xpMultiplier: 1,
  active: true,
  description: null,
  createdAt: '2026-10-01T00:00:00',
});

type Mocks = {
  rows?: LevelUpEvent[];
  status?: number;
};

function mockNotifications(m: Mocks = {}) {
  let rows = m.rows ?? [event(1, 11, false, 1), event(2, 12, true, 30), event(3, 99, false, 50)];
  const calls = { list: [] as (string | null)[], read: [] as number[], readAll: 0 };
  server.use(
    http.get('*/api/notifications/unread-count', () =>
      HttpResponse.json({ count: rows.filter((n) => !n.read).length }),
    ),
    http.get('*/api/notifications', ({ request }) => {
      const unreadOnly = new URL(request.url).searchParams.get('unreadOnly');
      calls.list.push(unreadOnly);
      if (m.status) return HttpResponse.json({ detail: 'Feed is down' }, { status: m.status });
      return HttpResponse.json(rows.filter((n) => unreadOnly !== 'true' || !n.read));
    }),
    http.post('*/api/notifications/read-all', () => {
      calls.readAll += 1;
      const updated = rows.filter((n) => !n.read).length;
      rows = rows.map((n) => ({ ...n, read: true }));
      return HttpResponse.json({ updated });
    }),
    http.post('*/api/notifications/:id/read', ({ params }) => {
      calls.read.push(Number(params.id));
      rows = rows.map((n) => (n.id === Number(params.id) ? { ...n, read: true } : n));
      return new HttpResponse(null, { status: 204 });
    }),
    http.get('*/api/activity/', () =>
      HttpResponse.json([activity(11, 'Running'), activity(12, 'Studying')]),
    ),
  );
  return calls;
}

function renderNotifications(path = '/app/notifications') {
  signIn(7, 'USER');
  return renderRoutes(
    [
      { path: '/app/notifications', element: <NotificationsPage /> },
      { path: '/app/history', element: <p>history page</p> },
      { path: '/app/log', element: <p>log page</p> },
    ],
    path,
  );
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe('Notifications — the feed', () => {
  it('shows each level-up with the new level, the activity and how long ago', async () => {
    mockNotifications();
    renderNotifications();

    expect(await screen.findByText('Level 7 in Running')).toBeInTheDocument();
    expect(screen.getByText('Level 8 in Studying')).toBeInTheDocument();
    // An activity that is not in the catalog still has a name.
    expect(screen.getByText('Level 9 in Activity #99')).toBeInTheDocument();
    expect(screen.getByText('Up from level 6.', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('2 new level-ups.')).toBeInTheDocument();
  });

  it('marks unread rows with a dot and says so for screen readers', async () => {
    mockNotifications();
    renderNotifications();

    const rows = await screen.findAllByRole('button', { name: /Level \d+ in/ });
    expect(within(rows[0] as HTMLElement).getByTestId('unread-dot')).toBeInTheDocument();
    expect(rows[0]).toHaveAccessibleName(/^Unread\./);
    expect(within(rows[1] as HTMLElement).queryByTestId('unread-dot')).not.toBeInTheDocument();
    expect(rows[1]).not.toHaveAccessibleName(/Unread/);
  });

  it('asks only for unread ones in the Unread view and keeps it in the URL', async () => {
    const calls = mockNotifications();
    const { router } = renderNotifications();
    await screen.findByText('Level 7 in Running');
    expect(calls.list[0]).toBe('false');

    await userEvent.click(screen.getByRole('radio', { name: 'Unread' }));
    await waitFor(() => expect(calls.list.at(-1)).toBe('true'));
    expect(router.state.location.search).toBe('?show=unread');
    expect(await screen.findByText('Level 9 in Activity #99')).toBeInTheDocument();
    expect(screen.queryByText('Level 8 in Studying')).not.toBeInTheDocument();
  });
});

describe('Notifications — reading', () => {
  it('marks a tapped level-up read and opens History for that activity', async () => {
    const calls = mockNotifications();
    const { router } = renderNotifications();

    await userEvent.click(await screen.findByRole('button', { name: /Level 7 in Running/ }));
    await waitFor(() => expect(calls.read).toEqual([1]));
    await waitFor(() => expect(router.state.location.pathname).toBe('/app/history'));
    expect(router.state.location.search).toBe('?activity=11');
  });

  it('does not post a read for one that is already read', async () => {
    const calls = mockNotifications();
    const { router } = renderNotifications();

    await userEvent.click(await screen.findByRole('button', { name: /Level 8 in Studying/ }));
    await waitFor(() => expect(router.state.location.search).toBe('?activity=12'));
    expect(calls.read).toEqual([]);
  });

  it('marks everything read in one call, says how many, and hides the button', async () => {
    const calls = mockNotifications();
    renderNotifications();

    await userEvent.click(await screen.findByRole('button', { name: 'Mark all as read' }));
    await waitFor(() => expect(calls.readAll).toBe(1));
    await waitFor(() =>
      expect(useToastStore.getState().toasts.map((t) => t.message)).toEqual(['Marked 2 as read']),
    );
    await waitFor(() => expect(screen.queryByTestId('unread-dot')).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Mark all as read' })).not.toBeInTheDocument();
    expect(screen.getByText("You're all caught up.")).toBeInTheDocument();
    expect(calls.read).toEqual([]); // not one request per row
  });

  it('has no Mark all as read when everything is read', async () => {
    mockNotifications({ rows: [event(1, 11, true)] });
    renderNotifications();
    await screen.findByText('Level 7 in Running');
    expect(screen.queryByRole('button', { name: 'Mark all as read' })).not.toBeInTheDocument();
  });
});

describe('Notifications — empty and error', () => {
  it('invites a first log when there are no level-ups', async () => {
    mockNotifications({ rows: [] });
    renderNotifications();

    expect(await screen.findByText('No level-ups yet')).toBeInTheDocument();
    expect(screen.getByText('Your first one is closer than you think.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log activity' })).toHaveAttribute('href', '/app/log');
  });

  it('says you are caught up in the Unread view with nothing unread', async () => {
    mockNotifications({ rows: [event(1, 11, true)] });
    renderNotifications('/app/notifications?show=unread');
    expect(await screen.findByText("You're all caught up")).toBeInTheDocument();
  });

  it('shows an error with a retry', async () => {
    mockNotifications({ status: 500 });
    renderNotifications();
    expect(await screen.findByText("Couldn't load notifications")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
