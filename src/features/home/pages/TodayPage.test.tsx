import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { RankCard } from '@/lib/api/types';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import TodayPage from './TodayPage';

const card: RankCard = {
  tier: 'ALPINE',
  overallLevel: 7,
  totalXp: 1234,
  percentile: 0.25,
  position: 30,
  totalUsers: 120,
  updatedAt: '2026-10-18T10:00:00',
};

function renderToday() {
  signIn(5, 'USER');
  return renderRoutes([{ path: '/app', element: <TodayPage /> }], '/app');
}

describe('TodayPage', () => {
  it('shows a skeleton, then the rank card from GET /api/ranks/me', async () => {
    server.use(http.get('*/api/ranks/me', () => HttpResponse.json(card)));
    renderToday();

    expect(screen.getByRole('status', { name: 'Loading your rank' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Alpine' })).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('1,234 XP')).toBeInTheDocument();
    expect(screen.getByText('Top 25%')).toBeInTheDocument();
  });

  it('shows a friendly not-ranked-yet state when the backend answers 404', async () => {
    server.use(
      http.get('*/api/ranks/me', () =>
        HttpResponse.json({ detail: 'No rank yet for userId: 5' }, { status: 404 }),
      ),
    );
    renderToday();

    expect(await screen.findByText("You're not ranked yet")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log your first activity' })).toHaveAttribute(
      'href',
      '/app/log',
    );
  });

  it('shows a retryable error panel on server errors', async () => {
    let calls = 0;
    server.use(
      http.get('*/api/ranks/me', () => {
        calls += 1;
        return calls === 1
          ? HttpResponse.json({ detail: 'database down' }, { status: 500 })
          : HttpResponse.json(card);
      }),
    );
    renderToday();

    expect(await screen.findByRole('alert')).toHaveTextContent('database down');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Alpine' })).toBeInTheDocument();
  });

  it('always offers the main Log activity action', async () => {
    server.use(http.get('*/api/ranks/me', () => HttpResponse.json(card)));
    renderToday();
    expect(screen.getByRole('link', { name: /log activity/i })).toHaveAttribute('href', '/app/log');
    await screen.findByRole('heading', { name: 'Alpine' });
  });
});
