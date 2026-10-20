import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PublicLayout from '@/app/layouts/PublicLayout';
import { RANK_TIERS } from '@/lib/api/types';
import { renderRoutes } from '@/test/helpers';
import LandingPage from './LandingPage';

const routes = [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/login', element: <p>login page</p> },
      { path: '*', element: <p>not found</p> },
    ],
  },
];

describe('LandingPage', () => {
  it('leads with the promise and sends people to sign up or log in', () => {
    renderRoutes(routes, '/');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Log what you do. Climb from Basecamp to Summit.',
    );
    for (const link of screen.getAllByRole('link', { name: 'Start at Basecamp' })) {
      expect(link).toHaveAttribute('href', '/register');
    }
    expect(screen.getAllByRole('link', { name: 'Log in' })[0]).toHaveAttribute('href', '/login');
  });

  it('draws the route as one labelled map', () => {
    renderRoutes(routes, '/');
    expect(screen.getByRole('img', { name: /route climbing through nine ranks/i })).toBeVisible();
  });

  it('lists all nine tiers, Summit first, with their position bands', () => {
    renderRoutes(routes, '/');
    const items = within(screen.getAllByRole('list')[0] as HTMLElement).getAllByRole('listitem');

    expect(items).toHaveLength(RANK_TIERS.length);
    expect(items[0]).toHaveTextContent('Summit');
    expect(items[0]).toHaveTextContent('Top 5%');
    expect(items[8]).toHaveTextContent('Basecamp');
    expect(items[8]).toHaveTextContent('Bottom 5%');
  });

  it('shows the real category multipliers, highest first', () => {
    renderRoutes(routes, '/');
    const rows = within(screen.getByRole('table')).getAllByRole('row');
    const cells = rows.slice(1).map((row) => row.textContent);

    expect(cells[0]).toBe('Study×1.5');
    expect(cells.at(-1)).toBe('Gaming×0.5');
  });

  it('wears the survey theme on the landing page and the sign-in card, not on other pages', () => {
    for (const [path, themed] of [
      ['/', true],
      ['/login', true],
      ['/somewhere-else', false],
    ] as const) {
      const { container, unmount } = renderRoutes(routes, path);
      expect(container.querySelector('.theme-survey') !== null).toBe(themed);
      unmount();
    }
  });
});
