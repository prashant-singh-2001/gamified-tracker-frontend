import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { CatalogActivity, Streak } from '@/features/activities/types';
import type { ActivityLogResponse } from '@/features/log-activity/types';
import type { RankDistribution, RankTierMember } from '@/features/ranks/types';
import type { WeeklyReport } from '@/features/stats/types';
import { RANK_TIERS, type Category, type RankCard, type RankTier } from '@/lib/api/types';
import { toServerDate } from '@/lib/utils/serverTime';
import { useLocation } from 'react-router';
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
  rank?: RankCard | null | 'unranked-200'; // null → 404
  myBoard?: RankTierMember[];
  streaks?: Streak[];
  weekly?: WeeklyReport;
  distribution?: RankDistribution[];
  /** Rows a tier board returns (default 3, i.e. a quiet tier). */
  tierRows?: number;
};

/** Registers every endpoint Home touches. `me/leaderboard` must come before `:tier/leaderboard`. */
function mockHome(m: Mocks = {}) {
  const tierRequests: string[] = [];
  const tierSizes: string[] = [];
  const recentLimits: string[] = [];
  server.use(
    http.get('*/api/activitylog/user/:id', () => HttpResponse.json(m.logs ?? [])),
    http.get('*/api/activitylog/user/:id/recent', ({ request }) => {
      const limit = new URL(request.url).searchParams.get('limit') ?? '';
      recentLimits.push(limit);
      const counts = new Map<string, { n: number; log: ActivityLogResponse }>();
      for (const l of m.logs ?? []) {
        if (!l.activity.active) continue;
        const hit = counts.get(l.activity.name) ?? { n: 0, log: l };
        counts.set(l.activity.name, { n: hit.n + 1, log: l });
      }
      return HttpResponse.json(
        [...counts.values()]
          .sort((a, b) => b.n - a.n)
          .slice(0, Number(limit))
          .map(({ n, log: l }) => ({
            activityId: l.activity.id,
            name: l.activity.name,
            category: l.activity.category,
            timesLogged: n,
            lastUsedAt: l.startTime,
          })),
      );
    }),
    http.get('*/api/activity', () => HttpResponse.json(m.catalog ?? [])),
    http.get('*/api/ranks/me/leaderboard', () => HttpResponse.json(m.myBoard ?? [])),
    http.get('*/api/ranks/:tier/leaderboard', ({ params, request }) => {
      const tier = String(params.tier);
      tierRequests.push(tier);
      tierSizes.push(new URL(request.url).searchParams.get('size') ?? '');
      return HttpResponse.json(members(m.tierRows ?? 3, tier as RankTier));
    }),
    http.get('*/api/ranks', () =>
      HttpResponse.json(
        m.distribution ?? RANK_TIERS.map((t) => ({ tier: t.id, userCount: m.tierRows ?? 3 })),
      ),
    ),
    http.get('*/api/ranks/me', () =>
      m.rank === null
        ? HttpResponse.json({ detail: 'No rank yet for userId: 7' }, { status: 404 })
        : m.rank === 'unranked-200'
          ? HttpResponse.json({ ranked: false })
          : HttpResponse.json(m.rank ?? rankCard),
    ),
    http.get('*/api/activitylog/streaks/user/:id', () => HttpResponse.json(m.streaks ?? [])),
    http.get('*/api/activitylog/analytics/user/:id/weekly-report', () =>
      HttpResponse.json(m.weekly ?? week()),
    ),
  );
  return { tierRequests, tierSizes, recentLimits };
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

    const running = await screen.findByRole('link', { name: 'Running' }, { timeout: 10_000 });
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
      id: name.length,
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

  it('shows how far through the tier band I am, with the next tier as the goal', async () => {
    // Alpine spans top 25-50%; 0.4 is 60% of the way down it, so 40% of the way up.
    mockHome({ rank: { ...rankCard, percentile: 0.4 }, myBoard: members(30, 'ALPINE', 15) });
    renderHome();

    const bar = await screen.findByRole('progressbar', { name: /Progress through Alpine/ });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByText('→ Ridge')).toBeInTheDocument();
    expect(screen.getByText('Alpine · 25–50%')).toBeInTheDocument();
  });

  it("tells me when I'm the only climber in my tier", async () => {
    mockHome({ rank: rankCard, myBoard: members(1, 'ALPINE', 0) });
    renderHome();

    const table = await screen.findByRole('table', { name: /around your position/i });
    expect(within(table).getAllByRole('row').slice(1)).toHaveLength(1);
    expect(screen.getByText("You're the only climber in Alpine for now.")).toBeInTheDocument();
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

describe('Home — route hero', () => {
  it('puts a marker on the route for a ranked climber, with the map kept decorative', async () => {
    mockHome({});
    renderHome();

    const marker = await screen.findByTestId('you-marker');
    expect(marker.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(marker).toHaveTextContent('You');
  });

  it('draws the route without a marker for someone who is not ranked yet', async () => {
    mockHome({ rank: null });
    renderHome();

    await screen.findByText("You're not ranked yet");
    expect(screen.queryByTestId('you-marker')).not.toBeInTheDocument();
  });

  it("shows today's numbers in the hero rather than in the Log card", async () => {
    mockHome({});
    renderHome();

    const today = await screen.findByRole('region', { name: 'Today' });
    const hero = screen.getByRole('region', { name: 'Alpine' });
    expect(hero).toContainElement(today);
    expect(screen.getByRole('region', { name: 'What did you do?' })).not.toContainElement(today);
  });

  it('explains an empty Around you panel to an unranked user', async () => {
    mockHome({ rank: null });
    renderHome();

    expect(
      await screen.findByText('Once you are ranked, the climbers next to you show up here.'),
    ).toBeInTheDocument();
  });
});

describe('Home — rank data from the API', () => {
  it('asks for the rank with allowUnranked, and reads {"ranked": false} as not ranked', async () => {
    let asked = '';
    mockHome({ rank: 'unranked-200' });
    server.use(
      http.get('*/api/ranks/me', ({ request }) => {
        asked = new URL(request.url).search;
        return HttpResponse.json({ ranked: false });
      }),
    );
    renderHome();

    expect(await screen.findByText("You're not ranked yet")).toBeInTheDocument();
    expect(asked).toBe('?allowUnranked=true');
  });

  it('shows how much XP the next tier is away, naming the tier the API chose', async () => {
    mockHome({
      rank: { ...rankCard, tierCutoffXp: 1000, nextTier: 'PEAK', xpToNextTier: 2492.8 },
    });
    renderHome();

    expect(await screen.findByText('2,493 XP to Peak')).toBeInTheDocument();
  });

  it('says Top tier at the top, where there is nothing further to climb', async () => {
    mockHome({
      rank: { ...rankCard, tier: 'SUMMIT', percentile: 0, nextTier: null, xpToNextTier: null },
    });
    renderHome();

    expect(await screen.findByText('Top tier')).toBeInTheDocument();
  });

  it('shows the names the API sends, and falls back to a number when there is none', async () => {
    mockHome({
      rank: rankCard,
      myBoard: [
        { ...members(1)[0]!, userId: 301, displayName: 'Ada L.' },
        { ...members(2)[1]!, userId: 302, displayName: null },
        { ...members(3)[2]!, userId: ME, displayName: 'Prashant S.' },
      ].map((m, i) => ({ ...m, withinRankPosition: i + 1 })),
    });
    renderHome();

    const table = await screen.findByRole('table', { name: /around your position/i });
    expect(within(table).getByText('Ada L.')).toBeInTheDocument();
    expect(within(table).getByText('Climber #302')).toBeInTheDocument();
    // the signed-in user is always "You", whatever name the API has
    expect(within(table).getByText('You')).toBeInTheDocument();
    expect(within(table).queryByText('Prashant S.')).not.toBeInTheDocument();
  });
});

describe('Home — data from the backend', () => {
  it('asks the server for four quick picks', async () => {
    const { recentLimits } = mockHome({ logs: [log(1, 'Running', 'HEALTH')] });
    renderHome();

    await screen.findByRole('link', { name: 'Running' });
    expect(recentLimits).toEqual(['4']);
  });

  it('names a live streak from the catalog, even when the activity was never logged here', async () => {
    mockHome({
      catalog: [
        {
          id: 10,
          name: 'Deep Work',
          category: 'WORK',
          xpMultiplier: 1.5,
          active: true,
          description: null,
          createdAt: '2026-10-01T00:00:00',
        },
      ],
      streaks: [
        {
          activityId: 10,
          currentStreak: 5,
          longestStreak: 5,
          lastActivityDate: utcDay(0),
          active: true,
        },
      ],
    });
    renderHome();

    const list = await screen.findByRole('list', { name: 'Active streaks' });
    expect(within(list).getByText('Deep Work')).toBeInTheDocument();
  });

  it('asks for the Monday-to-Sunday week', async () => {
    let query = '';
    mockHome({});
    server.use(
      http.get('*/api/activitylog/analytics/user/:id/weekly-report', ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(week());
      }),
    );
    renderHome();

    await screen.findByText('Monday to Sunday');
    expect(query).toBe('?mode=calendar');
  });

  it('draws days after today as empty columns, not as zero-XP days', async () => {
    const days = Array.from({ length: 7 }, (_, i) => ({
      date: utcDay(2 - i), // two days ago ... four days ahead
      totalXpEarned: i <= 2 ? 100 : 0,
      totalDurationMinutes: i <= 2 ? 30 : 0,
    }));
    mockHome({ weekly: week({ dailyBreakdown: days }) });
    renderHome();

    const strip = await screen.findAllByRole('listitem', { name: /not yet/ });
    expect(strip).toHaveLength(4);
    expect(screen.getAllByRole('listitem', { name: /: 100 XP/ })).toHaveLength(3);
  });
});

describe('Home — tier board', () => {
  const stepUp = async (times: number) => {
    for (let i = 0; i < times; i++) {
      await userEvent.click(screen.getByRole('button', { name: 'Higher tier' }));
    }
  };

  it('defaults to my own tier and steps up the mountain with the arrows', async () => {
    const { tierRequests } = mockHome({ rank: rankCard, myBoard: members(5, 'ALPINE', 2) });
    renderHome();

    await waitFor(() => expect(tierRequests).toContain('ALPINE'));
    expect(await screen.findByText('Your tier')).toBeInTheDocument();

    await stepUp(3); // Alpine → Ridge → Peak → Summit
    await waitFor(() => expect(tierRequests).toContain('SUMMIT'));
    expect(screen.getByRole('button', { name: 'Higher tier' })).toBeDisabled();
    expect(await screen.findByRole('table', { name: 'Top 8 in Summit' })).toBeInTheDocument();
    expect(screen.queryByText('Your tier')).not.toBeInTheDocument(); // not my tier any more
  });

  it('has no scrolling chip row: the tier picker is two arrow buttons', async () => {
    mockHome({ rank: rankCard, myBoard: members(5, 'ALPINE', 2) });
    renderHome();
    await screen.findByText('Your tier'); // the rank has loaded, so Alpine is selected
    expect(screen.getByRole('button', { name: 'Lower tier' })).toBeEnabled();
    expect(screen.queryByRole('group', { name: 'Choose a tier' })).not.toBeInTheDocument();
  });

  it('starts an unranked user at Basecamp, where no lower tier exists', async () => {
    const { tierRequests } = mockHome({ rank: null });
    renderHome();
    await waitFor(() => expect(tierRequests).toEqual(['BASECAMP']));
    expect(screen.getByRole('button', { name: 'Lower tier' })).toBeDisabled();
  });

  it('asks for eight rows', async () => {
    const { tierSizes } = mockHome({ rank: rankCard, myBoard: members(5, 'ALPINE', 2) });
    renderHome();
    await waitFor(() => expect(tierSizes).toContain('8'));
  });

  it('fills a quiet tier with a centred count instead of a blank area', async () => {
    mockHome({
      rank: rankCard,
      myBoard: members(5, 'ALPINE', 2),
      distribution: RANK_TIERS.map((t) => ({ tier: t.id, userCount: t.id === 'ALPINE' ? 3 : 0 })),
    });
    renderHome();
    expect(await screen.findByText('3 climbers in Alpine')).toBeInTheDocument();
  });

  it('says so when a tier is empty', async () => {
    mockHome({ rank: rankCard, myBoard: members(5, 'ALPINE', 2), tierRows: 0 });
    renderHome();
    expect(await screen.findByText('No one in Alpine yet')).toBeInTheDocument();
  });

  it('shows no filler once the board has a full eight rows', async () => {
    mockHome({ rank: rankCard, myBoard: members(5, 'ALPINE', 2), tierRows: 8 });
    renderHome();
    await screen.findByRole('table', { name: 'Top 8 in Alpine' });
    expect(screen.queryByText(/climbers? in Alpine/)).not.toBeInTheDocument();
  });

  it('keeps the link to the full board', async () => {
    mockHome({ rank: rankCard, myBoard: members(5, 'ALPINE', 2) });
    renderHome();
    expect(await screen.findByRole('link', { name: 'See the full Alpine board' })).toHaveAttribute(
      'href',
      '/app/ranks/ALPINE',
    );
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
    expect(screen.getByText(/up on the same days last week/)).toBeInTheDocument();
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
        {
          activityId: 10,
          currentStreak: 6,
          longestStreak: 9,
          lastActivityDate: yesterday(),
          active: true,
        },
        {
          activityId: 20,
          currentStreak: 3,
          longestStreak: 3,
          lastActivityDate: today(),
          active: true,
        },
        {
          activityId: 30,
          currentStreak: 12,
          longestStreak: 12,
          lastActivityDate: utcDay(5),
          active: false,
        }, // stale
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

describe('Home — this week chart', () => {
  it('labels every bar with its XP', async () => {
    mockHome({ weekly: week() });
    renderHome();

    await screen.findByText('560 XP');
    // 7 bars of 80 XP each → seven value labels (the Today stat also reads 80).
    expect(screen.getAllByText('80').length).toBeGreaterThanOrEqual(7);
  });
});

describe('Home — today at a glance', () => {
  it("shows today's XP and minutes from the weekly report and my best live streak", async () => {
    mockHome({
      streaks: [
        {
          activityId: 10,
          currentStreak: 6,
          longestStreak: 9,
          lastActivityDate: utcDay(0),
          active: true,
        },
        {
          activityId: 20,
          currentStreak: 3,
          longestStreak: 3,
          lastActivityDate: utcDay(1),
          active: true,
        },
        {
          activityId: 30,
          currentStreak: 20,
          longestStreak: 20,
          lastActivityDate: utcDay(9),
          active: false,
        }, // dead
      ],
    });
    renderHome();

    const today = await screen.findByRole('region', { name: 'Today' });
    await waitFor(() =>
      expect(within(today).getByText('Best streak').parentElement).toHaveTextContent('6 days'),
    );
    expect(within(today).getByText('80')).toBeInTheDocument(); // XP today
    expect(within(today).getByText('40')).toBeInTheDocument(); // minutes today
  });

  it('shows 0 for a user with no streak', async () => {
    mockHome({});
    renderHome();
    const today = await screen.findByRole('region', { name: 'Today' });
    await waitFor(() =>
      expect(within(today).getByText('Best streak').parentElement).toHaveTextContent('0 days'),
    );
  });
});

describe('Home — natural-language box', () => {
  function LogProbe() {
    const { pathname, search } = useLocation();
    return <p>sheet at {pathname + search}</p>;
  }

  it('hands the sentence to the Log sheet instead of saving anything', async () => {
    mockHome({});
    signIn(ME, 'USER');
    renderRoutes(
      [
        { path: '/app', element: <HomePage /> },
        { path: '/app/log', element: <LogProbe /> },
      ],
      '/app',
    );

    const box = await screen.findByRole('textbox', { name: 'Tell us what you did' });
    expect(box).toHaveAttribute('placeholder', expect.stringContaining('Studied Spring Boot'));
    await userEvent.type(box, 'Ran 5 km this morning');
    await userEvent.click(screen.getByRole('button', { name: 'Understand it' }));

    expect(
      await screen.findByText('sheet at /app/log?text=Ran%205%20km%20this%20morning'),
    ).toBeInTheDocument();
  });
});

describe('Home — recent activity', () => {
  const at = (
    daysAgo: number,
    id: number,
    name: string,
    extra: Partial<ActivityLogResponse> = {},
  ) => ({
    ...log(id, name),
    endTime: `${utcDay(daysAgo)}T10:00:00`,
    ...extra,
  });

  it('lists the four most recent logs, newest first', async () => {
    mockHome({
      logs: [
        at(5, 1, 'Fifth'),
        at(0, 2, 'Newest'),
        at(3, 3, 'Fourth'),
        at(1, 4, 'Second'),
        at(2, 5, 'Third'),
      ],
    });
    renderHome();

    const recent = await screen.findByRole('region', { name: 'Recent activity' });
    const names = within(await within(recent).findByRole('list'))
      .getAllByRole('listitem')
      .map((li) => li.textContent ?? '');
    expect(names).toHaveLength(4);
    expect(names[0]).toContain('Newest');
    expect(names[3]).toContain('Fourth');
    expect(within(recent).queryByText('Fifth')).not.toBeInTheDocument();
  });

  it('never shows held or rejected XP as earned', async () => {
    mockHome({
      logs: [
        at(0, 1, 'Held', { reviewStatus: 'FLAGGED', xpEarned: 900 }),
        at(1, 2, 'Rejected', { reviewStatus: 'REJECTED', xpEarned: 500 }),
        at(2, 3, 'Counted', { xpEarned: 60 }),
      ],
    });
    renderHome();

    const recent = await screen.findByRole('region', { name: 'Recent activity' });
    expect(await within(recent).findByText('900 on hold')).toBeInTheDocument();
    expect(within(recent).getByText('0 XP')).toBeInTheDocument();
    expect(within(recent).getByText('+60 XP')).toBeInTheDocument();
    expect(within(recent).queryByText('+900 XP')).not.toBeInTheDocument();
  });

  it('has a friendly empty state for a new user', async () => {
    mockHome({ logs: [] });
    renderHome();
    const recent = await screen.findByRole('region', { name: 'Recent activity' });
    expect(await within(recent).findByText(/Nothing logged yet/)).toBeInTheDocument();
  });
});
