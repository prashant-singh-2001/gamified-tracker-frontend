import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { CategoryTotal, WeeklyReport } from '@/features/stats/types';
import { qk } from '@/lib/api/queryKeys';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import type { WeeklyInsights } from '../types';
import WeeklyCoachPage from './WeeklyCoachPage';

const totals: WeeklyReport = {
  currentWeekXp: 1240,
  previousWeekXp: 980,
  percentageChange: 26.5,
  totalActiveMinutes: 640,
  topCategory: 'STUDY',
  dailyBreakdown: [],
};

const categories: CategoryTotal[] = [
  { category: 'HEALTH', totalDurationMinutes: 120, totalXpEarned: 260, totalSessions: 2 },
  { category: 'STUDY', totalDurationMinutes: 420, totalXpEarned: 780, totalSessions: 4 },
  { category: 'WORK', totalDurationMinutes: 600, totalXpEarned: 200, totalSessions: 1 },
];

const NOTE = 'You found a rhythm this week.\n\nHealth slipped after Tuesday.\n\nTry a morning run.';

function insights(over: Partial<WeeklyInsights> = {}): WeeklyInsights {
  return {
    weekStart: '2026-10-15',
    weekEnd: '2026-10-21',
    totals,
    categories,
    narrative: NOTE,
    narrativeStatus: 'GENERATED',
    ...over,
  };
}

/** Each call takes the next response; the last one repeats. `gate` holds a response until opened. */
function mockCoach(responses: (WeeklyInsights | number)[], gate?: Promise<void>) {
  let calls = 0;
  server.use(
    http.get('*/api/insights/weekly', async () => {
      const next = responses[Math.min(calls, responses.length - 1)];
      calls += 1;
      if (gate && calls > 1) await gate;
      return typeof next === 'number'
        ? HttpResponse.json({ detail: 'The coach is down' }, { status: next })
        : HttpResponse.json(next);
    }),
  );
  return { calls: () => calls };
}

function renderCoach(seed?: Parameters<typeof renderRoutes>[2]) {
  signIn(7, 'USER');
  return renderRoutes(
    [
      { path: '/app/coach', element: <WeeklyCoachPage /> },
      { path: '/app/log', element: <p>log page</p> },
    ],
    '/app/coach',
    seed,
  );
}

describe('Weekly coach — the letter', () => {
  it('sets the week as a heading, the note in paragraphs and a sign-off', async () => {
    mockCoach([insights()]);
    renderCoach();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Your week, 15–21 Oct' }),
    ).toBeInTheDocument();
    const letter = screen.getByRole('article');
    expect(within(letter).getByText('You found a rhythm this week.')).toBeInTheDocument();
    expect(within(letter).getByText('Health slipped after Tuesday.')).toBeInTheDocument();
    expect(within(letter).getByText('Try a morning run.')).toBeInTheDocument();
    expect(within(letter).getByText(/Written by your AI coach, /)).toBeInTheDocument();
    expect(within(letter).getByRole('button', { name: 'Write a new note' })).toBeInTheDocument();
  });

  it('says the coach is reading while the first note is written', async () => {
    let open: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (open = resolve));
    server.use(
      http.get('*/api/insights/weekly', async () => {
        await gate;
        return HttpResponse.json(insights());
      }),
    );
    renderCoach();

    expect(await screen.findByText('Your coach is reading your week…')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Your week' })).toBeInTheDocument();
    open();
    expect(await screen.findByText('Try a morning run.')).toBeInTheDocument();
    expect(screen.queryByText('Your coach is reading your week…')).not.toBeInTheDocument();
  });

  it('writes a new note on request and keeps the old one up until it arrives', async () => {
    let open: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => (open = resolve));
    const { calls } = mockCoach(
      [insights(), insights({ narrative: 'A quieter week, and that is fine.' })],
      gate,
    );
    renderCoach();

    await userEvent.click(await screen.findByRole('button', { name: 'Write a new note' }));
    expect(await screen.findByText('Writing a new note…')).toBeInTheDocument();
    expect(screen.getByText('Try a morning run.')).toBeInTheDocument(); // still readable
    expect(screen.getByRole('button', { name: 'Write a new note' })).toBeDisabled();

    open();
    expect(await screen.findByText('A quieter week, and that is fine.')).toBeInTheDocument();
    expect(screen.queryByText('Try a morning run.')).not.toBeInTheDocument();
    expect(screen.queryByText('Writing a new note…')).not.toBeInTheDocument();
    expect(calls()).toBe(2);
  });

  it('keeps a note for half an hour instead of asking the coach again', async () => {
    const { calls } = mockCoach([insights({ narrative: 'Asked again.' })]);
    renderCoach((client) => client.setQueryData(qk.insights.weekly(), insights()));

    expect(await screen.findByText('Try a morning run.')).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 60));
    expect(calls()).toBe(0);
    expect(screen.queryByText('Asked again.')).not.toBeInTheDocument();
  });
});

describe('Weekly coach — when the coach does not write', () => {
  it('says AI coaching is off and still shows the facts', async () => {
    mockCoach([insights({ narrative: null, narrativeStatus: 'DISABLED' })]);
    renderCoach();

    expect(await screen.findByText('AI coaching is off on this server.')).toBeInTheDocument();
    expect(screen.getByText('1,240 XP')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'This week by category' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Write a new note|Try again/ })).toBeNull();
  });

  it('says the coach could not write, and Try again asks again', async () => {
    const { calls } = mockCoach([
      insights({ narrative: null, narrativeStatus: 'UNAVAILABLE' }),
      insights(),
    ]);
    renderCoach();

    expect(
      await screen.findByText("Your coach couldn't write this week's note. Try again later."),
    ).toBeInTheDocument();
    expect(screen.getByText('1,240 XP')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Try a morning run.')).toBeInTheDocument();
    expect(calls()).toBe(2);
  });

  it('offers a note when the status says one was written but there is no text', async () => {
    mockCoach([insights({ narrative: null })]);
    renderCoach();
    expect(
      await screen.findByText('Your coach has no note for this week yet.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Write a note' })).toBeInTheDocument();
  });

  it('shows an error with a retry when the request fails', async () => {
    mockCoach([500]);
    renderCoach();
    expect(await screen.findByText("Couldn't load your week")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('Weekly coach — the facts', () => {
  it('shows the XP and its change, the active time and the top category', async () => {
    mockCoach([insights()]);
    renderCoach();

    expect(await screen.findByText('1,240 XP')).toBeInTheDocument();
    expect(screen.getByText('27%')).toBeInTheDocument();
    expect(screen.getByText(/up on the 7 days before/)).toBeInTheDocument();
    expect(screen.getByText('10 h 40 min')).toBeInTheDocument();
    const top = screen.getByText('Top category').nextElementSibling as HTMLElement;
    expect(top).toHaveTextContent('Study');
  });

  it('says down for a drop, and nothing logged for a quiet week', async () => {
    mockCoach([insights({ totals: { ...totals, percentageChange: -12 } })]);
    renderCoach();
    expect(await screen.findByText(/down on the 7 days before/)).toBeInTheDocument();
  });

  it('sorts categories by XP and sizes the bars by time, with the top row in the accent', async () => {
    mockCoach([insights()]);
    renderCoach();

    const list = await screen.findByRole('list', { name: 'This week by category' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Study'),
      expect.stringContaining('Health'),
      expect.stringContaining('Work'),
    ]);
    const bars = [...list.querySelectorAll<HTMLElement>('[aria-hidden="true"] > div')];
    expect(bars[0]).toHaveClass('bg-accent');
    expect(bars[1]).not.toHaveClass('bg-accent');
    // Work has the most time (600 min) though the least XP, so its bar is the full width.
    expect(bars[2]?.style.width).toBe('100%');
    expect(bars[0]?.style.width).toBe('70%');
  });

  it('invites a first log for a week with nothing in it', async () => {
    mockCoach([
      insights({
        categories: [],
        narrative: null,
        totals: {
          ...totals,
          currentWeekXp: 0,
          previousWeekXp: 0,
          totalActiveMinutes: 0,
          topCategory: null,
        },
      }),
    ]);
    renderCoach();

    expect(
      await screen.findByText(
        'Log an activity this week and your coach will have something to write about.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log activity' })).toHaveAttribute('href', '/app/log');
    expect(screen.getByText('Nothing logged yet.')).toBeInTheDocument();
    expect(screen.getByText('None yet')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('list', { name: /category/ })).toBeNull());
  });
});
