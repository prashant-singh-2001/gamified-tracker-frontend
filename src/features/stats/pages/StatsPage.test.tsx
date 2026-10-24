import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import type { BestTime, CategoryTotal, DailyXp, HourBucket, WeeklyReport } from '../types';
import StatsPage from './StatsPage';

const ME = 7;
const BASE = `*/api/activitylog/analytics/user/${ME}`;
const DAY = 86_400_000;

const isoDay = (offset: number, from = Date.now()) =>
  new Date(from + offset * DAY).toISOString().slice(0, 10);
const monday = isoDay(-((new Date().getUTCDay() + 6) % 7));
const lastMonday = isoDay(-7, new Date(`${monday}T00:00:00Z`).getTime());

/** Monday to Sunday of this week. Only Monday has XP, so the test is the same on any weekday. */
function week(over: Partial<WeeklyReport> = {}): WeeklyReport {
  return {
    currentWeekXp: 120,
    previousWeekXp: 200,
    percentageChange: -40,
    totalActiveMinutes: 90,
    topCategory: 'STUDY',
    dailyBreakdown: Array.from({ length: 7 }, (_, i) => ({
      date: isoDay(i, new Date(`${monday}T00:00:00Z`).getTime()),
      totalXpEarned: i === 0 ? 120 : 0,
      totalDurationMinutes: i === 0 ? 90 : 0,
    })),
    ...over,
  };
}

/** `days` zero-filled days ending today; every sixth day back has XP, last week's Monday has 90. */
function series(
  days: number,
  active = (ago: number) => ago % 6 === 0,
  lastMondayXp = 90,
): DailyXp[] {
  return Array.from({ length: days }, (_, i) => {
    const ago = days - 1 - i;
    const date = isoDay(-ago);
    const xp = date === lastMonday ? lastMondayXp : active(ago) ? 50 + ago : 0;
    return { date, totalXpEarned: xp, totalDurationMinutes: xp };
  });
}

const categories: CategoryTotal[] = [
  { category: 'HEALTH', totalDurationMinutes: 300, totalXpEarned: 600, totalSessions: 1 },
  { category: 'STUDY', totalDurationMinutes: 900, totalXpEarned: 1500, totalSessions: 12 },
  { category: 'WORK', totalDurationMinutes: 60, totalXpEarned: 90, totalSessions: 3 },
];

const hours = (xp: Record<number, number>): HourBucket[] =>
  Array.from({ length: 24 }, (_, hour) => ({
    hour,
    totalDurationMinutes: (xp[hour] ?? 0) / 2,
    totalXpEarned: xp[hour] ?? 0,
    totalSessions: xp[hour] ? 2 : 0,
  }));

const bestTime: BestTime = {
  hourlyBreakdown: hours({ 3: 400, 14: 150 }),
  bestHour: 3,
  bestCategory: 'STUDY',
  bestCategoryHour: 14,
};
const noBestTime: BestTime = {
  hourlyBreakdown: hours({}),
  bestHour: null,
  bestCategory: null,
  bestCategoryHour: null,
};

type Mocks = {
  week?: WeeklyReport;
  weekStatus?: number;
  series?: (days: number) => DailyXp[];
  categories?: CategoryTotal[];
  best?: BestTime;
};

function mockStats(m: Mocks = {}) {
  const calls = { days: [] as number[], modes: [] as string[] };
  server.use(
    http.get(`${BASE}/weekly-report`, ({ request }) => {
      calls.modes.push(new URL(request.url).searchParams.get('mode') ?? '');
      return m.weekStatus
        ? HttpResponse.json({ detail: 'Analytics are down' }, { status: m.weekStatus })
        : HttpResponse.json(m.week ?? week());
    }),
    http.get(`${BASE}/xp-over-time`, ({ request }) => {
      const days = Number(new URL(request.url).searchParams.get('days'));
      calls.days.push(days);
      return HttpResponse.json((m.series ?? series)(days));
    }),
    http.get(`${BASE}/category-summary`, () => HttpResponse.json(m.categories ?? categories)),
    http.get(`${BASE}/best-time-of-day`, () => HttpResponse.json(m.best ?? bestTime)),
  );
  return calls;
}

function renderStats(path = '/app/stats') {
  signIn(ME, 'USER');
  return renderRoutes([{ path: '/app/stats', element: <StatsPage /> }], path);
}

describe('Stats page', () => {
  it('shows the four questions in order', async () => {
    mockStats();
    renderStats();

    expect(screen.getByRole('heading', { level: 1, name: 'Stats' })).toBeInTheDocument();
    await screen.findByRole('list', { name: 'Time by category' });
    const questions = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(questions).toEqual([
      'Am I doing more than last week?',
      'Am I consistent?',
      'Where does my time go?',
      'When am I most productive?',
    ]);
  });

  it('shows an error with a retry when a card fails, and keeps the others', async () => {
    mockStats({ weekStatus: 500 });
    renderStats();

    expect(await screen.findByText("Couldn't load this week")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(await screen.findByRole('list', { name: 'Time by category' })).toBeInTheDocument();
  });
});

describe('Stats — this week', () => {
  it('shows the week, the drop and last week as outlines', async () => {
    const calls = mockStats();
    renderStats();

    const week = await screen.findByRole('heading', { name: 'Am I doing more than last week?' });
    const scope = within(week.closest('div')?.parentElement as HTMLElement);
    expect(await scope.findByText('120 XP', { selector: 'p' })).toBeInTheDocument();
    expect(scope.getByText('40%')).toBeInTheDocument();
    expect(scope.getByText(/down on the same days last week/)).toBeInTheDocument();
    await waitFor(() => expect(scope.getAllByTestId('ghost-bar').length).toBeGreaterThan(0));
    expect(calls.days).toContain(14);
  });

  it('says up for a gain', async () => {
    mockStats({ week: week({ percentageChange: 25 }) });
    renderStats();
    expect(await screen.findByText(/up on the same days last week/)).toBeInTheDocument();
  });

  it('reads out a day, with last week, when it is tapped', async () => {
    mockStats();
    renderStats();

    const mondayBar = await screen.findByLabelText(/^Mon.*120 XP/);
    await userEvent.click(mondayBar);
    expect(await screen.findByText(/120 XP · 1 h 30 min · last week 90 XP/)).toBeInTheDocument();
  });

  it('invites a first log when nothing has been logged', async () => {
    mockStats({ week: week({ currentWeekXp: 0, previousWeekXp: 0, percentageChange: 0 }) });
    renderStats();
    expect(await screen.findByText('Log an activity to start your week.')).toBeInTheDocument();
    expect(screen.getByText('Nothing logged yet this week.')).toBeInTheDocument();
  });
});

describe('Stats — this week or the last 7 days', () => {
  it('asks for the calendar week by default and the rolling one when chosen', async () => {
    const calls = mockStats();
    const { router } = renderStats();

    await screen.findByText(/down on the same days last week/);
    expect(calls.modes).toEqual(['calendar']);
    expect(screen.getByRole('radio', { name: 'This week' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Last 7 days' }));
    await waitFor(() => expect(calls.modes).toContain('rolling'));
    expect(router.state.location.search).toBe('?week=rolling');
    expect(screen.getByRole('radio', { name: 'Last 7 days' })).toBeChecked();
    expect(await screen.findByText(/down on the 7 days before/)).toBeInTheDocument();
  });

  it('opens on the last 7 days from the URL, and can go back', async () => {
    const calls = mockStats();
    const { router } = renderStats('/app/stats?week=rolling');

    await screen.findByText(/down on the 7 days before/);
    expect(calls.modes).toEqual(['rolling']);

    await userEvent.click(screen.getByRole('radio', { name: 'This week' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
    expect(await screen.findByText(/down on the same days last week/)).toBeInTheDocument();
  });

  it('keeps the range of the trend when the week changes', async () => {
    mockStats();
    renderStats('/app/stats?week=rolling');
    await screen.findByText(/of 30 days/);
    await userEvent.click(screen.getByRole('radio', { name: '7 days' }));
    expect(await screen.findByText(/of 7 days/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Last 7 days' })).toBeChecked();
  });
});

describe('Stats — trend', () => {
  it('counts active days and flags the best one', async () => {
    mockStats();
    renderStats();

    const active = series(30).filter((d) => d.totalXpEarned > 0).length;
    expect(await screen.findByText(`${active} of 30 days`)).toBeInTheDocument();
    expect(screen.getByText(/Best day .* with \d+ XP/)).toBeInTheDocument();
    expect(screen.getByTestId('summit-flag')).toBeInTheDocument();
  });

  it('asks for the range that is chosen', async () => {
    const calls = mockStats();
    renderStats();
    await screen.findByText(/of 30 days/);

    await userEvent.click(screen.getByRole('radio', { name: '90 days' }));
    const active = series(90).filter((d) => d.totalXpEarned > 0).length;
    expect(await screen.findByText(`${active} of 90 days`)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '90 days' })).toBeChecked();
    expect(calls.days).toContain(90);

    await userEvent.click(screen.getByRole('radio', { name: '7 days' }));
    expect(await screen.findByText(/of 7 days/)).toBeInTheDocument();
    expect(calls.days).toContain(7);
  });

  it('scrubs with the arrow keys and reads the day out', async () => {
    mockStats();
    renderStats();

    const slider = await screen.findByRole('slider', { name: 'Daily XP' });
    slider.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(slider).toHaveAttribute('aria-valuetext', expect.stringMatching(/\d+ XP/));
    expect(screen.getAllByText(/\d+ XP · /).length).toBeGreaterThan(0);
  });

  it('asks for three active days before drawing a trend', async () => {
    mockStats({ series: (days) => series(days, (ago) => ago === 0 || ago === 1, 0) });
    renderStats();
    expect(await screen.findByText('Log on 3 days to see a trend.')).toBeInTheDocument();
    expect(screen.getByText('2 of 30 days')).toBeInTheDocument();
    expect(screen.queryByRole('slider', { name: 'Daily XP' })).not.toBeInTheDocument();
  });
});

describe('Stats — where my time goes', () => {
  it('names the top category and lists them biggest first', async () => {
    mockStats();
    renderStats();

    const list = await screen.findByRole('list', { name: 'Time by category' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Study'),
      expect.stringContaining('Health'),
      expect.stringContaining('Work'),
    ]);
    expect(rows[0]).toHaveTextContent('15 h');
    expect(rows[0]).toHaveTextContent('1,500 XP from 12 sessions');
    expect(rows[2]).toHaveTextContent('3 sessions');
    expect(screen.getByText(/15 h of the 21 h you have logged/)).toBeInTheDocument();
    // Only the biggest bar uses the accent colour.
    const bars = list.querySelectorAll('[aria-hidden="true"] > div');
    expect(bars[0]).toHaveClass('bg-accent');
    expect(bars[1]).not.toHaveClass('bg-accent');
  });

  it('invites a first log when nothing has been logged', async () => {
    mockStats({ categories: [] });
    renderStats();
    expect(
      await screen.findByText('Log an activity to see where your time goes.'),
    ).toBeInTheDocument();
  });
});

describe('Stats — best time', () => {
  it('shows the best hour in the viewer time zone, not UTC', async () => {
    mockStats();
    renderStats();

    // Tests run in Asia/Kolkata (UTC+5:30): 03:00 UTC is 8:30 am, 14:00 UTC is 7:30 pm.
    expect(await screen.findByText('8:30–9:30 am', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Most Study XP comes around 7:30 pm.')).toBeInTheDocument();
    expect(screen.getByTestId('best-hour-bar')).toHaveClass('bg-accent');
  });

  it('starts the day at local midnight and reads an hour out', async () => {
    mockStats();
    renderStats();

    const slider = await screen.findByRole('slider', { name: 'XP by hour of the day' });
    slider.focus();
    // Keyboard focus lands on the best hour first.
    expect(
      await screen.findByText(/8:30–9:30 am · 400 XP · 3 h 20 min · 2 sessions/),
    ).toBeInTheDocument();
    await userEvent.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuetext', expect.stringContaining('9:30–10:30 am'));
    const table = screen.getByRole('table', { name: 'XP by hour of the day, in your time zone' });
    expect(within(table).getAllByRole('row')).toHaveLength(25);
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('12:30–1:30 am');
  });

  it('invites a few logs before it knows', async () => {
    mockStats({ best: noBestTime });
    renderStats();
    expect(
      await screen.findByText('Log a few sessions to find your best time.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('best-hour-bar')).not.toBeInTheDocument();
  });
});
