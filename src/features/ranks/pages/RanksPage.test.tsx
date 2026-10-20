import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { CatalogActivity } from '@/features/activities/types';
import { RANK_TIERS, type RankCard, type RankTier } from '@/lib/api/types';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import type { LeaderboardEntry, RankTierMember } from '../types';
import RanksPage from './RanksPage';

const ME = 7;

const card: RankCard = {
  tier: 'ALPINE',
  overallLevel: 7,
  totalXp: 1234,
  percentile: 0.31,
  position: 30,
  totalUsers: 120,
  updatedAt: '2026-10-19T10:00:00',
  nextTier: 'RIDGE',
  xpToNextTier: 1500,
  tierCutoffXp: 1000,
};

function member(
  i: number,
  tier: RankTier,
  userId = 200 + i,
  name: string | null = null,
): RankTierMember {
  return {
    withinRankPosition: i + 1,
    userId,
    totalXp: 5000 - i * 10,
    overallLevel: 6,
    tier,
    displayName: name,
  };
}

const rows = (count: number, tier: RankTier, from = 0) =>
  Array.from({ length: count }, (_, i) => member(from + i, tier));

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
  rank?: RankCard | null;
  /** Users per tier; default 3 each, Alpine 45, Peak 0, Summit 1. */
  counts?: Partial<Record<RankTier, number>>;
  /** Rows a tier board returns for (tier, page). */
  tierRows?: (tier: RankTier, page: number) => RankTierMember[];
  myBoard?: RankTierMember[];
  global?: (activityId: number | null, page: number) => LeaderboardEntry[];
  myGlobalRank?: number;
  catalog?: CatalogActivity[];
};

function mockRanks(m: Mocks = {}) {
  const calls = { tier: [] as string[], global: [] as string[] };
  const counts: Record<RankTier, number> = {
    BASECAMP: 3,
    TRAILHEAD: 3,
    FOOTHILL: 3,
    HIGHLAND: 3,
    ASCENT: 3,
    ALPINE: 45,
    RIDGE: 3,
    PEAK: 0,
    SUMMIT: 1,
    ...m.counts,
  };
  server.use(
    http.get('*/api/ranks/me/leaderboard', () => HttpResponse.json(m.myBoard ?? [])),
    http.get('*/api/ranks/:tier/leaderboard', ({ params, request }) => {
      const url = new URL(request.url);
      const tier = String(params.tier) as RankTier;
      const page = Number(url.searchParams.get('page'));
      calls.tier.push(`${tier}:${page}:${url.searchParams.get('size')}`);
      return HttpResponse.json(m.tierRows?.(tier, page) ?? rows(Math.min(counts[tier], 5), tier));
    }),
    http.get('*/api/ranks/me', () =>
      m.rank === null ? HttpResponse.json({ ranked: false }) : HttpResponse.json(m.rank ?? card),
    ),
    http.get('*/api/ranks', () =>
      HttpResponse.json(RANK_TIERS.map((t) => ({ tier: t.id, userCount: counts[t.id] }))),
    ),
    http.get('*/api/leaderboard/me', () => HttpResponse.json(m.myGlobalRank ?? 300)),
    http.get('*/api/leaderboard/activity/:id', ({ params, request }) => {
      const url = new URL(request.url);
      calls.global.push(
        `activity ${params.id}:${url.searchParams.get('page')}:${url.searchParams.get('size')}`,
      );
      return HttpResponse.json(m.global?.(Number(params.id), 0) ?? []);
    }),
    http.get('*/api/leaderboard', ({ request }) => {
      const url = new URL(request.url);
      calls.global.push(`all:${url.searchParams.get('page')}:${url.searchParams.get('size')}`);
      const page = Number(url.searchParams.get('page'));
      return HttpResponse.json(
        m.global?.(null, page) ??
          Array.from({ length: 3 }, (_, i) => ({
            rank: i + 1,
            userId: 400 + i,
            totalXp: 9000 - i,
            displayName: i === 0 ? 'Ada L.' : null,
          })),
      );
    }),
    http.get('*/api/activity/', () => HttpResponse.json(m.catalog ?? [])),
  );
  return calls;
}

function renderRanks(path = '/app/ranks') {
  signIn(ME, 'USER');
  return renderRoutes(
    [
      { path: '/app/ranks', element: <RanksPage /> },
      { path: '/app/ranks/:tier', element: <RanksPage /> },
      { path: '/app/log', element: <p>log page</p> },
    ],
    path,
  );
}

describe('Ranks — header', () => {
  it('shows tier, place, level and the XP to the next tier', async () => {
    mockRanks();
    renderRanks();

    expect(await screen.findByRole('heading', { level: 1, name: 'Alpine' })).toBeInTheDocument();
    expect(screen.getByText('Top 31%')).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent === '#30 of 120'),
    ).toBeInTheDocument();
    expect(screen.getByText('Level 7')).toBeInTheDocument();
    expect(screen.getByText('1,500 XP to Ridge')).toBeInTheDocument();
    expect(screen.getByText(/Rank updates every few minutes/)).toBeInTheDocument();
  });

  it('says Top tier at the top, where there is no next tier', async () => {
    mockRanks({
      rank: { ...card, tier: 'SUMMIT', percentile: 0, nextTier: null, xpToNextTier: null },
    });
    renderRanks();
    expect(await screen.findByText('Top tier')).toBeInTheDocument();
  });

  it('invites someone who is not ranked yet to log, with no marker on the mountain', async () => {
    mockRanks({ rank: null });
    renderRanks();

    expect(
      await screen.findByRole('heading', { name: "You're not ranked yet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log your first activity' })).toHaveAttribute(
      'href',
      '/app/log',
    );
    await screen.findByRole('list', { name: /rank tiers/i });
    expect(screen.queryByTestId('you-marker')).not.toBeInTheDocument();
  });
});

describe('Ranks — mountain', () => {
  it('lists the nine tiers from Summit down, with bands and head counts', async () => {
    mockRanks();
    renderRanks();

    const list = await screen.findByRole('list', { name: 'Rank tiers, Summit to Basecamp' });
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(9);
    expect(items[0]).toHaveTextContent('Summit');
    expect(items[0]).toHaveTextContent('Top 5%');
    expect(items[0]).toHaveTextContent('1 climber');
    expect(items[1]).toHaveTextContent('Peak');
    expect(items[1]).toHaveTextContent('Nobody yet');
    expect(items[2]).toHaveTextContent('Ridge');
    expect(items[2]).toHaveTextContent('3 climbers');
    expect(items[8]).toHaveTextContent('Basecamp');
    expect(items[8]).toHaveTextContent('Bottom 5%');
  });

  it('marks your own tier and puts the marker on the trail', async () => {
    mockRanks();
    renderRanks();

    const list = await screen.findByRole('list', { name: /rank tiers/i });
    const own = within(list).getByRole('listitem', { current: true });
    expect(own).toHaveTextContent('Alpine');
    expect(own).toHaveTextContent('You are here');
    expect(await screen.findByTestId('you-marker')).toBeInTheDocument();
  });

  it('opens a tier’s board when its row is chosen', async () => {
    mockRanks();
    renderRanks();

    const list = await screen.findByRole('list', { name: /rank tiers/i });
    expect(within(list).getByRole('link', { name: /Ridge/ })).toHaveAttribute(
      'href',
      '/app/ranks/RIDGE',
    );
    await userEvent.click(within(list).getByRole('link', { name: /Ridge/ }));

    expect(await screen.findByRole('heading', { level: 2, name: /Ridge/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tier board', selected: true })).toBeInTheDocument();
  });
});

describe('Ranks — tier board', () => {
  it('starts on the tier in the URL and marks your own tier among the chips', async () => {
    const calls = mockRanks();
    renderRanks('/app/ranks/RIDGE');

    expect(await screen.findByRole('table', { name: 'Ridge tier' })).toBeInTheDocument();
    expect(calls.tier).toContain('RIDGE:0:50');

    const chips = screen.getByRole('navigation', { name: 'Choose a tier' });
    expect(within(chips).getAllByRole('link')).toHaveLength(9);
    expect(within(chips).getByRole('link', { name: 'Ridge' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(chips).getByRole('link', { name: /Alpine/ })).toHaveTextContent('(your tier)');
  });

  it('switches tier from a chip', async () => {
    const calls = mockRanks();
    renderRanks('/app/ranks/RIDGE');
    await screen.findByRole('table', { name: 'Ridge tier' });

    await userEvent.click(screen.getByRole('link', { name: /Alpine/ }));
    expect(await screen.findByRole('table', { name: 'Alpine tier' })).toBeInTheDocument();
    expect(calls.tier).toContain('ALPINE:0:50');
  });

  it('loads 50 rows and then more on request', async () => {
    const calls = mockRanks({
      tierRows: (tier, page) => (page === 0 ? rows(50, tier) : rows(3, tier, 50)),
    });
    renderRanks('/app/ranks/ALPINE');

    const table = await screen.findByRole('table', { name: 'Alpine tier' });
    expect(within(table).getAllByRole('row')).toHaveLength(51); // header + 50
    await userEvent.click(screen.getByRole('button', { name: 'Show more' }));

    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(54));
    expect(calls.tier).toEqual(['ALPINE:0:50', 'ALPINE:1:50']);
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('says so when nobody is in the tier', async () => {
    mockRanks({ tierRows: () => [] });
    renderRanks('/app/ranks/PEAK');
    expect(await screen.findByText('Nobody in Peak yet.')).toBeInTheDocument();
  });

  it('pins your row when you are further down than the rows loaded', async () => {
    mockRanks({
      tierRows: (tier) => rows(50, tier),
      myBoard: [...rows(70, 'ALPINE'), member(70, 'ALPINE', ME), ...rows(10, 'ALPINE', 71)],
    });
    renderRanks('/app/ranks/ALPINE');

    const pinned = await screen.findByRole('group', { name: 'Your place' });
    expect(pinned).toHaveTextContent('#71');
    expect(pinned).toHaveTextContent('You');
  });

  it('does not pin your row when it is already in the list', async () => {
    mockRanks({
      tierRows: (tier) => [...rows(4, tier), member(4, tier, ME), ...rows(5, tier, 5)],
      myBoard: [...rows(4, 'ALPINE'), member(4, 'ALPINE', ME)],
    });
    renderRanks('/app/ranks/ALPINE');

    const table = await screen.findByRole('table', { name: 'Alpine tier' });
    expect(within(table).getByText('You')).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Your place' })).not.toBeInTheDocument();
  });

  it('shows the names the API sends and a number for people without one', async () => {
    mockRanks({
      tierRows: (tier) => [member(0, tier, 301, 'Ava G.'), member(1, tier, 302, null)],
    });
    renderRanks('/app/ranks/RIDGE');

    const table = await screen.findByRole('table', { name: 'Ridge tier' });
    expect(within(table).getByText('Ava G.')).toBeInTheDocument();
    expect(within(table).getByText('Climber #302')).toBeInTheDocument();
  });
});

describe('Ranks — global board', () => {
  it('asks for the first 50 and shows names with a number fallback', async () => {
    const calls = mockRanks();
    renderRanks('/app/ranks?tab=global');

    const table = await screen.findByRole('table', { name: 'Top climbers overall' });
    expect(calls.global).toEqual(['all:0:50']);
    expect(within(table).getByText('Ada L.')).toBeInTheDocument();
    expect(within(table).getByText('Climber #401')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Global', selected: true })).toBeInTheDocument();
  });

  it('filters to one activity and keeps the choice in the URL', async () => {
    const calls = mockRanks({
      catalog: [activity(11, 'Running'), activity(12, 'Studying')],
      global: (id) => [
        id === 11
          ? { rank: 1, userId: 500, totalXp: 700, displayName: 'Mira K.' }
          : { rank: 1, userId: 400, totalXp: 9000, displayName: 'Ada L.' },
      ],
    });
    const { router } = renderRanks('/app/ranks?tab=global');
    await screen.findByRole('table', { name: 'Top climbers overall' });
    await screen.findByRole('option', { name: 'Running' });

    await userEvent.selectOptions(screen.getByLabelText('Activity'), 'Running');

    expect(await screen.findByRole('heading', { name: 'Top in Running' })).toBeInTheDocument();
    expect(await screen.findByText('Mira K.')).toBeInTheDocument();
    expect(calls.global).toContain('activity 11:0:50');
    expect(router.state.location.search).toBe('?tab=global&activity=11');
  });

  it('says so when nobody has logged the chosen activity', async () => {
    mockRanks({ catalog: [activity(11, 'Running')], global: () => [] });
    renderRanks('/app/ranks?tab=global&activity=11');
    expect(await screen.findByText('Nobody has logged Running yet.')).toBeInTheDocument();
  });

  it('pins your overall place from /leaderboard/me when you are not in the rows', async () => {
    mockRanks({ myGlobalRank: 300 });
    renderRanks('/app/ranks?tab=global');

    const pinned = await screen.findByRole('group', { name: 'Your place' });
    expect(pinned).toHaveTextContent('#300');
    expect(pinned).toHaveTextContent('1,234');
  });

  it('does not pin anything on an activity board, which has no "my rank"', async () => {
    mockRanks({
      catalog: [activity(11, 'Running')],
      global: () => [{ rank: 1, userId: 500, totalXp: 700, displayName: 'Mira K.' }],
    });
    renderRanks('/app/ranks?tab=global&activity=11');

    await screen.findByText('Mira K.');
    expect(screen.queryByRole('group', { name: 'Your place' })).not.toBeInTheDocument();
  });
});

describe('Ranks — navigation', () => {
  it('moves between the three views with the tabs, and the URL follows', async () => {
    mockRanks();
    const { router } = renderRanks('/app/ranks');
    await screen.findByRole('list', { name: /rank tiers/i });

    await userEvent.click(screen.getByRole('tab', { name: 'Tier board' }));
    await screen.findByRole('table', { name: 'Alpine tier' }); // your own tier by default
    expect(router.state.location.pathname).toBe('/app/ranks/ALPINE');

    await userEvent.click(screen.getByRole('tab', { name: 'Global' }));
    await screen.findByRole('table', { name: 'Top climbers overall' });
    expect(router.state.location.search).toBe('?tab=global');

    await userEvent.click(screen.getByRole('tab', { name: 'Mountain' }));
    expect(await screen.findByRole('list', { name: /rank tiers/i })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/app/ranks');
  });

  it('shows the mountain for a tier name that does not exist', async () => {
    mockRanks();
    renderRanks('/app/ranks/NOPE');
    expect(await screen.findByRole('list', { name: /rank tiers/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Mountain', selected: true })).toBeInTheDocument();
  });
});
