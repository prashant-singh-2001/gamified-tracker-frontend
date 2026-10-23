import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { ActivityLogResponse } from '@/features/log-activity/types';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import type { CatalogActivity, LevelTracker, Streak, Threshold } from '../types';
import ActivityDetailPage from './ActivityDetailPage';

const ME = 7;

const running: CatalogActivity = {
  id: 11,
  name: 'Running',
  category: 'HEALTH',
  xpMultiplier: 1.3,
  active: true,
  description: null,
  createdAt: '2026-10-01T00:00:00',
};

const tracker: LevelTracker = {
  userId: ME,
  activityId: 11,
  level: 3,
  totalXp: 450,
  currentLevelXp: 150,
  // The backend cannot see the default curve, so it says 0 to go and 100% here.
  xpForNextLevel: 0,
  progressPercent: 100,
  leveledUp: false,
};

/** Cumulative XP: level n needs 50 * n * (n - 1), so 0, 100, 300, 600, 1000, ... */
const ladderFor = (id: number, upTo: number): Threshold[] =>
  Array.from({ length: upTo }, (_, i) => ({
    activityId: id,
    level: i + 1,
    xpRequired: 50 * (i + 1) * i,
  }));

const streak: Streak = {
  activityId: 11,
  currentStreak: 6,
  longestStreak: 9,
  lastActivityDate: '2026-10-22',
  active: true,
};

function log(id: number, name = 'Running'): ActivityLogResponse {
  return {
    id,
    userId: ME,
    activity: { ...running, name },
    startTime: '2026-10-22T05:00:00',
    endTime: '2026-10-22T06:00:00',
    durationMinutes: 60,
    xpEarned: 40,
    notes: null,
    createdAt: '2026-10-22T06:00:00',
    bonusApplied: false,
    bonusMultiplier: 1,
    leveledUp: false,
    currentStreak: 1,
    streakMultiplier: 1,
    reviewStatus: 'CLEARED',
    nameResolution: null,
  };
}

type Mocks = {
  activity?: CatalogActivity | 404 | 500;
  levels?: LevelTracker[];
  streaks?: Streak[];
  logs?: ActivityLogResponse[];
  /** Ladder rows to return, whatever `upToLevel` asks for. */
  ladder?: Threshold[];
};

function mockActivity(m: Mocks = {}) {
  const calls = {
    upToLevel: [] as string[],
    logs: [] as URLSearchParams[],
    activity: [] as { idOrName: string; includeInactive: string | null }[],
  };
  server.use(
    http.get('*/api/activity/:id', ({ params, request }) => {
      calls.activity.push({
        idOrName: String(params.id),
        includeInactive: new URL(request.url).searchParams.get('includeInactive'),
      });
      if (m.activity === 404) return HttpResponse.json({ detail: 'Not found' }, { status: 404 });
      if (m.activity === 500) return HttpResponse.json({ detail: 'Down' }, { status: 500 });
      return HttpResponse.json(m.activity ?? running);
    }),
    http.get('*/api/level/user/:id', () => HttpResponse.json(m.levels ?? [tracker])),
    http.get('*/api/threshold/activity/:id', ({ params, request }) => {
      const upTo = new URL(request.url).searchParams.get('upToLevel') ?? '10';
      calls.upToLevel.push(upTo);
      return HttpResponse.json(m.ladder ?? ladderFor(Number(params.id), Number(upTo)));
    }),
    http.get('*/api/activitylog/streaks/user/:id', () => HttpResponse.json(m.streaks ?? [streak])),
    http.get('*/api/activitylog/user/:id', ({ request }) => {
      calls.logs.push(new URL(request.url).searchParams);
      const rows = m.logs ?? [log(1), log(2), log(3)];
      return HttpResponse.json({
        content: rows,
        page: 0,
        size: 50,
        totalElements: rows.length,
        totalPages: 1,
        sort: 'startTime,desc',
      });
    }),
  );
  return calls;
}

function renderDetail(idOrName: number | string = 11, role: 'USER' | 'ADMIN' = 'USER') {
  signIn(ME, role);
  return renderRoutes(
    [
      { path: '/app/activities/:idOrName', element: <ActivityDetailPage /> },
      { path: '/app/history', element: <p>history page</p> },
      { path: '/app/log', element: <p>log page</p> },
    ],
    `/app/activities/${encodeURIComponent(String(idOrName))}`,
  );
}

describe('Activity detail — the header and level', () => {
  it('shows the activity, its category and effective multiplier', async () => {
    mockActivity();
    renderDetail();

    expect(await screen.findByRole('heading', { level: 1, name: 'Running' })).toBeInTheDocument();
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('×1.3 XP')).toBeInTheDocument();
  });

  it('shows the level ring and the XP to the next level from the ladder, not the tracker', async () => {
    mockActivity();
    renderDetail();

    // Level 3 starts at 300, level 4 at 600: 450 total is 150 of 300, half way.
    expect(
      await screen.findByRole('img', { name: 'Level 3, 50% of the way to level 4' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/150 \/ 300 XP/)).toBeInTheDocument();
    expect(screen.getByText(/to level 4/)).toBeInTheDocument();
  });

  it('asks for the ladder five levels past yours', async () => {
    const calls = mockActivity();
    renderDetail();
    await screen.findByRole('list', { name: 'Level ladder' });
    await waitFor(() => expect(calls.upToLevel).toContain('8'));
  });

  it('says to log it once when there is no level yet', async () => {
    mockActivity({ levels: [] });
    renderDetail();

    expect(await screen.findByText('Log it once to start levelling.')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /^Level 1, 0% of the way to level 2/ }),
    ).toBeInTheDocument();
  });

  it('says you are at the top when the ladder has no next level', async () => {
    mockActivity({ ladder: ladderFor(11, 3) });
    renderDetail();

    expect(await screen.findByText("You're at the top of the ladder.")).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Level 3, the top of the ladder' })).toBeInTheDocument();
  });
});

describe('Activity detail — streak, ladder and sessions', () => {
  it('shows a live streak with the longest and the last day logged', async () => {
    mockActivity();
    renderDetail();

    expect(await screen.findByText('6-day streak')).toBeInTheDocument();
    expect(screen.getByText(/Longest: 9 days/)).toBeInTheDocument();
    expect(screen.getByText(/Last logged Oct 22/)).toBeInTheDocument();
  });

  it('does not show a stale streak as live', async () => {
    mockActivity({ streaks: [{ ...streak, active: false }] });
    renderDetail();

    expect(await screen.findByText(/No streak right now/)).toBeInTheDocument();
    expect(screen.queryByText('6-day streak')).not.toBeInTheDocument();
    expect(screen.getByText(/Longest: 9 days/)).toBeInTheDocument();
  });

  it('ticks past levels and marks the current one', async () => {
    mockActivity();
    renderDetail();

    const ladder = await screen.findByRole('list', { name: 'Level ladder' });
    // The ladder is first asked for before the level is known, then again five past it.
    await within(ladder).findByText(/Level 8/);
    const rows = within(ladder).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('Level 1');
    expect(rows[0]).toHaveTextContent('reached');
    expect(rows[1]).toHaveTextContent('Level 2');
    const current = within(ladder)
      .getByText(/Level 3/)
      .closest('li');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(current).toHaveTextContent('You are here');
    expect(current).toHaveTextContent('300 XP');
    expect(rows.at(-1)).toHaveTextContent('Level 8');
  });

  it("lists this activity's last five sessions and links on to History for it", async () => {
    const calls = mockActivity({ logs: Array.from({ length: 7 }, (_, i) => log(i + 1)) });
    renderDetail();

    const heading = await screen.findByRole('heading', { name: 'Recent sessions' });
    const section = heading.closest('section') as HTMLElement;
    await waitFor(() =>
      expect(within(section).getAllByRole('link', { name: /Running/ })).toHaveLength(5),
    );
    expect(calls.logs[0]?.get('activityId')).toBe('11');
    expect(within(section).getByRole('link', { name: /See all in History/ })).toHaveAttribute(
      'href',
      '/app/history?activity=11',
    );
  });

  it('opens Log activity with the activity filled in', async () => {
    mockActivity({ activity: { ...running, name: 'Deep work' } });
    renderDetail();
    expect(await screen.findByRole('link', { name: 'Log this activity' })).toHaveAttribute(
      'href',
      '/app/log?activity=Deep%20work',
    );
  });
});

describe('Activity detail — when it cannot load', () => {
  it('says the activity is not available for an unknown or removed one', async () => {
    mockActivity({ activity: 404 });
    renderDetail(99);

    expect(await screen.findByText("This activity isn't available")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open History' })).toHaveAttribute(
      'href',
      '/app/history',
    );
  });

  it('shows an error with a retry for any other failure', async () => {
    mockActivity({ activity: 500 });
    renderDetail();

    expect(await screen.findByText("Couldn't load this activity")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('Activity detail — by name, and for admins', () => {
  it('opens by name and settles on the id address', async () => {
    const calls = mockActivity({ activity: { ...running, name: 'Deep work' } });
    const { router } = renderDetail('Deep work');

    expect(await screen.findByRole('heading', { level: 1, name: 'Deep work' })).toBeInTheDocument();
    expect(calls.activity[0]).toEqual({ idOrName: 'Deep work', includeInactive: null });
    await waitFor(() => expect(router.state.location.pathname).toBe('/app/activities/11'));
  });

  it('does not ask a user for inactive activities', async () => {
    const calls = mockActivity();
    renderDetail(11, 'USER');
    await screen.findByRole('heading', { level: 1, name: 'Running' });
    expect(calls.activity.every((c) => c.includeInactive === null)).toBe(true);
  });

  it('lets an admin open a deactivated activity, with a banner and no Log button', async () => {
    const calls = mockActivity({ activity: { ...running, active: false } });
    renderDetail(11, 'ADMIN');

    expect(await screen.findByRole('heading', { level: 1, name: 'Running' })).toBeInTheDocument();
    expect(calls.activity[0]).toEqual({ idOrName: '11', includeInactive: 'true' });
    expect(
      screen.getByText(
        'This activity is inactive. It is hidden from the Log screen and cannot be logged.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log this activity' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /See all in History/ })).toBeInTheDocument();
  });

  it('shows no banner for an active activity', async () => {
    mockActivity();
    renderDetail(11, 'ADMIN');
    await screen.findByRole('heading', { level: 1, name: 'Running' });
    expect(screen.queryByText(/This activity is inactive/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log this activity' })).toBeInTheDocument();
  });
});
