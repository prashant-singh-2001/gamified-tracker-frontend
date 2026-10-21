import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { qk } from '@/lib/api/queryKeys';
import type { RankCard } from '@/lib/api/types';
import { makeTestQueryClient, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { DivisionSteps } from './DivisionSteps';
import { RankMoment } from './RankMoment';

const before: RankCard = {
  tier: 'RIDGE',
  division: 2,
  divisionProgress: 0.9,
  position: 9,
  totalUsers: 240,
  percentile: 0.04,
  totalXp: 3000,
  overallLevel: 6,
  updatedAt: '2026-10-20T04:12:01',
  nextDivisionTier: 'RIDGE',
  nextDivision: 1,
  xpToNextDivision: 20,
};

function renderMoment(after: RankCard | null) {
  signIn(7, 'USER');
  server.use(
    http.get('*/api/ranks/me', () =>
      after ? HttpResponse.json({ ranked: true, ...after }) : HttpResponse.json({ ranked: false }),
    ),
  );
  const client = makeTestQueryClient();
  client.setQueryData(qk.ranks.me(), before);
  // The result opens with the card as it was, then a refresh brings the new one.
  void client.invalidateQueries({ queryKey: qk.ranks.all });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <RankMoment />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Rank moment after logging', () => {
  it('stays a quiet line when nothing moved', async () => {
    renderMoment({ ...before });
    expect(await screen.findByText(/Ranks refresh about every 30 seconds/)).toBeInTheDocument();
    expect(screen.getByText(/Ridge II/)).toBeInTheDocument();
    expect(screen.getByText('About 20 XP to Ridge I')).toBeInTheDocument();
    expect(screen.queryByText(/Promoted|You reached|Up \d/)).not.toBeInTheDocument();
  });

  it('marks a promotion to the next division', async () => {
    renderMoment({ ...before, division: 1, divisionProgress: 0.05, position: 7 });
    expect(await screen.findByText('Promoted to Ridge I')).toBeInTheDocument();
    expect(screen.queryByText(/Ranks refresh about every 30 seconds/)).not.toBeInTheDocument();
  });

  it('marks reaching a new tier', async () => {
    renderMoment({ ...before, tier: 'PEAK', division: 3, divisionProgress: 0.1, position: 5 });
    expect(await screen.findByText('You reached Peak III')).toBeInTheDocument();
  });

  it('says how many places were gained', async () => {
    renderMoment({ ...before, position: 6 });
    expect(await screen.findByText('Up 3 places')).toBeInTheDocument();
  });

  it('does not celebrate falling', async () => {
    renderMoment({ ...before, position: 20 });
    expect(await screen.findByText(/#20 of 240/)).toBeInTheDocument();
    expect(screen.queryByText(/Up \d|Promoted|You reached/)).not.toBeInTheDocument();
  });
});

describe('DivisionSteps', () => {
  const filled = (container: HTMLElement) =>
    [...container.querySelectorAll('rect')].filter((r) => r.getAttribute('fill') !== 'none').length;

  it('fills the steps up to yours, III the first and I the top', () => {
    const three = render(<DivisionSteps tier="RIDGE" division={3} />);
    expect(filled(three.container)).toBe(1);
    const two = render(<DivisionSteps tier="RIDGE" division={2} />);
    expect(filled(two.container)).toBe(2);
    const one = render(<DivisionSteps tier="RIDGE" division={1} />);
    expect(filled(one.container)).toBe(3);
  });

  it('is hidden from screen readers, the numeral carries the meaning', () => {
    const { container } = render(<DivisionSteps tier="RIDGE" division={1} />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('AnimatedNumber', () => {
  it('shows the value at once, then glides to a changed one', async () => {
    const { rerender } = render(<AnimatedNumber value={10} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    await act(async () => rerender(<AnimatedNumber value={1000} />));
    await waitFor(() => expect(screen.getByText('1,000')).toBeInTheDocument(), { timeout: 2000 });
  });
});
