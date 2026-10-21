import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { RANK_TIERS, type RankCard, type RankTier } from '@/lib/api/types';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import type { RankTierMember } from '../types';
import RanksPage from './RanksPage';

const ME = 7;

const ridge: RankCard = {
  tier: 'RIDGE',
  division: 2,
  divisionProgress: 0.4,
  position: 3,
  totalUsers: 240,
  percentile: 0.0125,
  rankScore: 912.4,
  totalXp: 3851.57,
  overallLevel: 6,
  tierCutoffXp: 850.1,
  nextTier: 'PEAK',
  xpToNextTier: 249.3,
  nextDivisionTier: 'RIDGE',
  nextDivision: 1,
  xpToNextDivision: 61.3,
  positionChange: 4,
  previousTier: 'ALPINE',
  previousDivision: 3,
  trend: 'UP',
  updatedAt: '2026-10-20T04:12:01',
};

function mockRanks(card: RankCard, board: RankTierMember[] = []) {
  server.use(
    http.get('*/api/ranks/me/leaderboard', () => HttpResponse.json(board)),
    http.get('*/api/ranks/:tier/leaderboard', () => HttpResponse.json(board)),
    http.get('*/api/ranks/me', () => HttpResponse.json({ ranked: true, ...card })),
    http.get('*/api/ranks', () =>
      HttpResponse.json(RANK_TIERS.map((t) => ({ tier: t.id, userCount: 4 }))),
    ),
  );
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

const row = (i: number, over: Partial<RankTierMember> = {}): RankTierMember => ({
  withinRankPosition: i + 1,
  userId: 100 + i,
  totalXp: 5000 - i,
  overallLevel: 9,
  tier: 'RIDGE' as RankTier,
  displayName: `Climber ${i}`,
  rankScore: 900 - i * 10,
  division: 1,
  positionChange: 2,
  trend: 'UP',
  ...over,
});

describe('Rank card with divisions', () => {
  it('shows the step, the top share, the place and what moved', async () => {
    mockRanks(ridge);
    renderRanks();

    expect(await screen.findByRole('heading', { level: 1, name: 'Ridge II' })).toBeInTheDocument();
    expect(screen.getByText('Top 1%')).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent === '#3 of 240'),
    ).toBeInTheDocument();
    expect(screen.getByText('Up 4 places recently')).toBeInTheDocument();
    expect(screen.getByText('Level 6')).toBeInTheDocument();
    expect(screen.getByText('3,852')).toBeInTheDocument(); // lifetime XP, separate from the score
    expect(screen.queryByText(/percentile/i)).not.toBeInTheDocument();
  });

  it('measures progress through the division and nudges to the next step as approximate', async () => {
    mockRanks(ridge);
    renderRanks();

    const bar = await screen.findByRole('progressbar', {
      name: 'Progress through Ridge II, towards Ridge I',
    });
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByText('About 60 XP to Ridge I')).toBeInTheDocument();
    expect(screen.getByText(/Ranks refresh about every 30 seconds/)).toBeInTheDocument();
    expect(screen.getByText(/Your place follows your recent form/)).toBeInTheDocument();
  });

  it('can nudge across a tier', async () => {
    mockRanks({
      ...ridge,
      division: 1,
      nextDivisionTier: 'PEAK',
      nextDivision: 3,
      xpToNextDivision: 249.3,
    });
    renderRanks();
    expect(await screen.findByText('About 250 XP to Peak III')).toBeInTheDocument();
  });

  it('has nothing above Summit I', async () => {
    mockRanks({
      ...ridge,
      tier: 'SUMMIT',
      division: 1,
      divisionProgress: 1,
      position: 1,
      percentile: 0,
      nextTier: null,
      xpToNextTier: null,
      nextDivisionTier: null,
      nextDivision: null,
      xpToNextDivision: null,
      trend: 'SAME',
      positionChange: 0,
    });
    renderRanks();

    expect(await screen.findByRole('heading', { level: 1, name: 'Summit I' })).toBeInTheDocument();
    expect(screen.getByText('You are at the top of the mountain.')).toBeInTheDocument();
    expect(screen.getByText('Holding steady')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('starts a new climber at the bottom without a number to compare', async () => {
    mockRanks({
      ...ridge,
      tier: 'BASECAMP',
      division: 3,
      divisionProgress: 0.05,
      position: 240,
      percentile: 0.996,
      nextDivisionTier: 'BASECAMP',
      nextDivision: 2,
      xpToNextDivision: 2.2,
      trend: 'NEW',
      positionChange: null,
    });
    renderRanks();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Basecamp III' }),
    ).toBeInTheDocument();
    expect(screen.getByText('New on the mountain')).toBeInTheDocument();
    expect(screen.getByText('About 3 XP to Basecamp II')).toBeInTheDocument();
  });

  it('frames a demotion as the climb continuing', async () => {
    mockRanks({ ...ridge, tier: 'ALPINE', division: 1, trend: 'DEMOTED', positionChange: -9 });
    renderRanks();

    expect(await screen.findByText('Now Alpine I. The climb continues.')).toBeInTheDocument();
    expect(screen.queryByText(/demoted|dropped|lost/i)).not.toBeInTheDocument();
  });

  it('leads with the promotion and hides a place count that disagrees', async () => {
    mockRanks({ ...ridge, division: 1, trend: 'PROMOTED', positionChange: -6 });
    renderRanks();

    expect(await screen.findByText('Promoted to Ridge I')).toBeInTheDocument();
    expect(screen.queryByText(/places/)).not.toBeInTheDocument();
    expect(screen.queryByText(/[-−]6/)).not.toBeInTheDocument();
  });

  it('shows no movement before there is a trend', async () => {
    mockRanks({ ...ridge, trend: null, positionChange: null });
    renderRanks();

    await screen.findByRole('heading', { level: 1, name: 'Ridge II' });
    expect(screen.queryByText(/recently|Holding steady|Promoted|New on/)).not.toBeInTheDocument();
  });

  it('is not shown a rank card for someone who is not ranked yet', async () => {
    server.use(
      http.get('*/api/ranks/me', () => HttpResponse.json({ ranked: false })),
      http.get('*/api/ranks', () =>
        HttpResponse.json(RANK_TIERS.map((t) => ({ tier: t.id, userCount: 0 }))),
      ),
    );
    renderRanks();
    expect(
      await screen.findByRole('heading', { name: "You're not ranked yet" }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log your first activity' })).toHaveAttribute(
      'href',
      '/app/log',
    );
  });
});

describe('Ladder with divisions', () => {
  it('names your division on your tier and still links an empty tier', async () => {
    mockRanks(ridge);
    renderRanks();

    const ladder = await screen.findByRole('list', { name: /rank tiers/i });
    const mine = within(ladder).getByRole('link', { name: /Ridge/ });
    expect(mine).toHaveTextContent('You are here');
    expect(within(mine).getByText(/division II/)).toBeInTheDocument();
    // Every row's label column is the same width, so the bars start at the same place.
    const widths = new Set(
      within(ladder)
        .getAllByTestId('tier-label')
        .map((el) => el.className),
    );
    expect(widths.size).toBe(1);
    expect(within(ladder).getByRole('link', { name: /Summit/ })).toHaveAttribute(
      'href',
      '/app/ranks/SUMMIT',
    );
  });
});

describe('Tier board with divisions', () => {
  it('shows each climber division, recent-form score and movement', async () => {
    mockRanks(ridge, [
      row(0),
      row(1, { division: 2, trend: 'SAME', positionChange: 0, rankScore: 4100 }),
      row(2, { division: 3, trend: 'DOWN', positionChange: -3, displayName: null }),
      row(3, { trend: 'PROMOTED', positionChange: -12 }),
      row(4, { trend: 'NEW', positionChange: null, totalXp: 98_765_432 }),
    ]);
    renderRanks('/app/ranks/RIDGE');

    const table = await screen.findByRole('table', { name: 'Ridge tier' });
    const rows = within(table).getAllByRole('row');
    const columns = within(rows[0] as HTMLElement)
      .getAllByRole('columnheader')
      .map((c) => c.textContent);
    expect(columns).toEqual(['Position', 'Player', 'Division', 'Level', 'Movement', 'Score']);

    const first = rows[1] as HTMLElement;
    expect(first).toHaveTextContent('I');
    expect(within(first).getByText('Up 2 places recently')).toBeInTheDocument(); // for screen readers
    expect(first).toHaveTextContent('900'); // the score, not the lifetime XP
    expect(rows[2]).toHaveTextContent('4,100');
    expect(rows[2]).toHaveTextContent('II');
    expect(rows[3]).toHaveTextContent('Climber #102'); // account gone
    expect(rows[3]).toHaveTextContent('III');
    expect(within(rows[3] as HTMLElement).getByText(/The climb continues/)).toBeInTheDocument();
    // A promotion shows the word, never its negative place count.
    expect(rows[4]).not.toHaveTextContent(/12/);
    expect(within(rows[4] as HTMLElement).getByText('Promoted to Ridge I')).toBeInTheDocument();
    expect(rows[5]).toHaveTextContent('New');
    expect(screen.queryByText('98,765,432')).not.toBeInTheDocument();
  });

  it('highlights your own row and keeps a very long name in one line', async () => {
    const long = 'Maximilian-Alexander Featherstonehaugh-Montgomery W.';
    mockRanks(ridge, [
      row(0, { displayName: long }),
      row(1, { userId: ME, displayName: 'Prashant S.' }),
    ]);
    renderRanks('/app/ranks/RIDGE');

    const name = await screen.findByText(long);
    expect(name).toHaveClass('truncate');
    const own = screen.getByText('You').closest('tr');
    expect(own).toHaveAttribute('aria-current', 'true');
  });

  it('says so when nobody is in the tier', async () => {
    mockRanks(ridge, []);
    renderRanks('/app/ranks/SUMMIT');
    expect(await screen.findByText('Nobody in Summit yet.')).toBeInTheDocument();
  });

  it('falls back to lifetime XP and no steps on a backend without divisions', async () => {
    const { division: _d, ...plain } = row(0);
    void _d;
    const { rankScore: _s, trend: _t, positionChange: _p, ...older } = plain;
    void _s;
    void _t;
    void _p;
    mockRanks(ridge, [older]);
    renderRanks('/app/ranks/RIDGE');

    const table = await screen.findByRole('table', { name: 'Ridge tier' });
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((c) => c.textContent);
    expect(headers).toEqual(['Position', 'Player', 'Level', 'XP']);
    expect(within(table).getByText('5,000')).toBeInTheDocument();
  });
});
