import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { CatalogActivity, Streak } from '@/features/activities/types';
import type { ActivityLogResponse } from '@/features/log-activity/types';
import type { RankTierMember } from '@/features/ranks/types';
import type { WeeklyReport } from '@/features/stats/types';
import type { Category, RankCard, RankTier } from '@/lib/api/types';
import { toServerDate } from '@/lib/utils/serverTime';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import HomePage from './HomePage';

const ME = 7;
const DAY = 86_400_000;
const utcDay = (daysAgo: number) => toServerDate(new Date(Date.now() - daysAgo * DAY));

function log(id: number, name: string, category: Category = 'STUDY'): ActivityLogResponse {
  return {
    id,
    userId: ME,
    activity: {
      id: id * 10,
      name,
      category,
      xpMultiplier: 1,
      active: true,
      description: null,
      createdAt: '2026-10-01T00:00:00',
    },
    startTime: '2026-10-18T08:00:00',
    endTime: '2026-10-18T09:00:00',
    durationMinutes: 60,
    xpEarned: 100,
    notes: null,
    createdAt: '2026-10-18T09:00:00',
    bonusApplied: false,
    bonusMultiplier: 1,
    leveledUp: false,
    currentStreak: 1,
    streakMultiplier: 1,
    reviewStatus: 'CLEARED',
    nameResolution: null,
  };
}

const rankCard: RankCard = {
  tier: 'ALPINE',
  overallLevel: 7,
  totalXp: 1234,
  percentile: 0.25,
  position: 30,
  totalUsers: 120,
  updatedAt: '2026-10-19T10:00:00',
};

function members(count: number, tier: RankTier = 'ALPINE', meAt = -1): RankTierMember[] {
  return Array.from({ length: count }, (_, i) => ({
    withinRankPosition: i + 1,
    userId: i === meAt ? ME : 200 + i,
    totalXp: 5000 - i * 10,
    overallLevel: 6,
    tier,
  }));
}

function week(overrides: Partial<WeeklyReport> = {}): WeeklyReport {
  return {
    currentWeekXp: 560,
    previousWeekXp: 500,
    percentageChange: 12,
    totalActiveMinutes: 300,
    topCategory: 'STUDY',
    dailyBreakdown: Array.from({ length: 7 }, (_, i) => ({
      date: utcDay(6 - i),
      totalXpEarned: 80,
      totalDurationMinutes: 40,
    })),
    ...overrides,
  };
}

type Mocks = {
  logs?: ActivityLogResponse[];
  catalog?: CatalogActivity[];
  rank?: RankCard | null; // null → 404
  myBoard?: RankTierMember[];
  streaks?: Streak[];
  weekly?: WeeklyReport;
};

/** Registers every endpoint Home touches. `me/leaderboard` must come before `:tier/leaderboard`. */
function mockHome(m: Mocks = {}) {
  const tierRequests: string[] = [];
  server.use(
    http.get('*/api/activitylog/user/:id', () => HttpResponse.json(m.logs ?? [])),
    http.get('*/api/activity/', () => HttpResponse.json(m.catalog ?? [])),
    http.get('*/api/ranks/me/leaderboard', () => HttpResponse.json(m.myBoard ?? [])),
    http.get('*/api/ranks/:tier/leaderboard', ({ params }) => {
      const tier = String(params.tier);
      tierRequests.push(tier);
      return HttpResponse.json(members(3, tier as RankTier));
    }),
    http.get('*/api/ranks/me', () =>
      m.rank === null
        ? HttpResponse.json({ detail: 'No rank yet for userId: 7' }, { status: 404 })
        : HttpResponse.json(m.rank ?? rankCard),
    ),
    http.get('*/api/activitylog/streaks/user/:id', () => HttpResponse.json(m.streaks ?? [])),
    http.get('*/api/activitylog/analytics/user/:id/weekly-report', () =>
      HttpResponse.json(m.weekly ?? week()),
    ),
  );
  return { tierRequests };
}

function renderHome() {
  signIn(ME, 'USER');
  return renderRoutes([{ path: '/app', element: <HomePage /> }], '/app');
}

describe('Home — Log card quick picks', () => {
  it('offers the most-logged activities first, with the type pre-filled', async () => {
    mockHome({
      logs: [
        log(1, 'Chess', 'GAMING'),
        log(2, 'Running', 'HEALTH'),
        log(3, 'Running', 'HEALTH'),
        log(4, 'Running', 'HEALTH'),
        log(5, 'Reading'),
        log(6, 'Reading'),
      ],
    });
    renderHome();

    const running = await screen.findByRole('link', { name: 'Running' });
    expect(running).toHaveAttribute('href', '/app/log?activity=Running');

    const picks = new Set(['Running', 'Reading', 'Chess']);
    const order = screen
      .getAllByRole('link')
      .map((a) => a.textContent ?? '')
      .filter((name) => picks.has(name));
    expect(order).toEqual(['Running', 'Reading', 'Chess']);
    expect(screen.getByRole('link', { name: 'Something else…' })).toHaveAttribute(
      'href',
      '/app/log',
    );
  });

  it('falls back to active catalog entries for a brand-new user', async () => {
    const entry = (name: string, active: boolean): CatalogActivity => ({
      name,
      category: 'STUDY',
      xpMultiplier: 0,
      active,
      description: null,
      createdAt: '2026-10-01T00:00:00',
    });
    mockHome({ logs: [], catalog: [entry('Studying', true), entry('Retired', false)] });
    renderHome();

    expect(await screen.findByRole('link', { name: 'Studying' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Retired' })).not.toBeInTheDocument();
  });
});

describe('Home — rank cards', () => {
  it('shows the tier, position and the people around me', async () => {
    mockHome({ rank: rankCard, myBoard: members(30, 'ALPINE', 15) });
    renderHome();

    expect(await screen.findByRole('heading', { name: 'Alpine' })).toBeInTheDocument();
    expect(screen.getByText('Top 25%')).toBeInTheDocument();
    expect(screen.getByText('#30 of 120')).toBeInTheDocument();
    expect(screen.getByText('Rank updates every few minutes.')).toBeInTheDocument();

    const table = await screen.findByRole('table', { name: /around your position/i });
    const rows = within(table).getAllByRole('row').slice(1); // drop the header row
    expect(rows).toHaveLength(11);
    const own = rows.find((r) => r.getAttribute('aria-current') === 'true');
    expect(within(own!).getByText('You')).toBeInTheDocument();
    expect(within(rows[0]!).getByText(/Climber #/)).toBeInTheDocument();
  });

  it('pins me under the top rows when my tier is bigger than the page', async () => {
    mockHome({ rank: rankCard, myBoard: members(100, 'ALPINE') }); // I'm not in the loaded rows
    renderHome();

    const table = await screen.findByRole('table', { name: /around your position/i });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(6); // top 5 + me
    expect(within(rows.at(-1)!).getByText('You')).toBeInTheDocument();
  });

  it('invites an unranked user to log, and shows the tier ladder', async () => {
    mockHome({ rank: null });
    renderHome();

    expect(await screen.findByText("You're not ranked yet")).toBeInTheDocument();
    const ladder = screen.getByRole('list', { name: /rank tiers/i });
    expect(within(ladder).getAllByRole('listitem')).toHaveLength(9);
    expect(screen.getAllByRole('link', { name: 'Log your first activity' })[0]).toHaveAttribute(
      'href',
      '/app/log',
    );
  });
});

describe('Home — tier board', () => {
  it('defaults to my own tier and switches when another is picked', async () => {
    const { tierRequests } = mockHome({ rank: rankCard, myBoard: members(5, 'ALPINE', 2) });
    renderHome();

    const alpine = await screen.findByRole('button', { name: 'Alpine' });
    await waitFor(() => expect(tierRequests).toContain('ALPINE'));
    expect(alpine).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Summit' }));
    await waitFor(() => expect(tierRequests).toContain('SUMMIT'));
    expect(screen.getByRole('button', { name: 'Summit' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('table', { name: 'Top 5 in Summit' })).toBeInTheDocument();
  });

  it('starts an unranked user at Basecamp', async () => {
    const { tierRequests } = mockHome({ rank: null });
    renderHome();
    await waitFor(() => expect(tierRequests).toEqual(['BASECAMP']));
  });
});

describe('Home — this week', () => {
  const today = () => utcDay(0);
  const yesterday = () => utcDay(1);

  it('shows the week XP, the change versus last week and one bar per day', async () => {
    mockHome({ weekly: week() });
    renderHome();

    expect(await screen.findByText('560 XP')).toBeInTheDocument();
    expect(screen.getByText(/12%/)).toBeInTheDocument();
    expect(screen.getByText(/up on last week/)).toBeInTheDocument();
    const strip = screen
      .getAllByRole('listitem')
      .filter((li) => li.getAttribute('aria-label')?.includes('XP'));
    expect(strip).toHaveLength(7);
  });

  it('lists only live streaks, with the right call to action', async () => {
    const logs = [log(1, 'Running', 'HEALTH'), log(2, 'Reading')];
    mockHome({
      logs,
      streaks: [
        { activityId: 10, currentStreak: 6, longestStreak: 9, lastActivityDate: yesterday() },
        { activityId: 20, currentStreak: 3, longestStreak: 3, lastActivityDate: today() },
        { activityId: 30, currentStreak: 12, longestStreak: 12, lastActivityDate: utcDay(5) }, // stale
      ],
    });
    renderHome();

    const list = await screen.findByRole('list', { name: 'Active streaks' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(2);

    const running = items.find((i) => within(i).queryByText('Running'))!;
    expect(within(running).getByRole('link', { name: 'Log today to keep it' })).toHaveAttribute(
      'href',
      '/app/log?activity=Running',
    );
    const reading = items.find((i) => within(i).queryByText('Reading'))!;
    expect(within(reading).getByText('Done for today')).toBeInTheDocument();
  });

  it('shows an empty, dashed week for someone who has not logged anything', async () => {
    mockHome({ weekly: week({ currentWeekXp: 0, previousWeekXp: 0, percentageChange: 0 }) });
    renderHome();

    expect(await screen.findByText('Log an activity to start your week.')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'No activity yet this week' })).toBeInTheDocument();
  });
});
