import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { CatalogActivity } from '@/features/activities/types';
import type { ActivityLogResponse, ReviewStatus } from '@/features/log-activity/types';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import { rangeStart } from '../filters';
import type { LogPage } from '../types';
import HistoryPage from './HistoryPage';
import LogDetailPage from './LogDetailPage';

const ME = 7;
/** A local time today, so the logs are on "Today" whatever time the suite runs. */
const todayAt = (hour: number) => {
  const d = new Date();
  d.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0);
  return d.toISOString().slice(0, 19);
};
/** `hoursAgo` counts back from 8 pm today. */
const iso = (hoursAgo: number) => todayAt(20 - hoursAgo);

const running: CatalogActivity = {
  id: 11,
  name: 'Running',
  category: 'HEALTH',
  xpMultiplier: 1,
  active: true,
  description: null,
  createdAt: '2026-10-01T00:00:00',
};
const studying: CatalogActivity = { ...running, id: 12, name: 'Studying', category: 'STUDY' };

function log(
  id: number,
  hoursAgo: number,
  xp: number,
  status: ReviewStatus = 'CLEARED',
  activity = running,
  over: Partial<ActivityLogResponse> = {},
): ActivityLogResponse {
  return {
    id,
    userId: ME,
    activity,
    startTime: iso(hoursAgo + 1),
    endTime: iso(hoursAgo),
    durationMinutes: 60,
    xpEarned: xp,
    notes: null,
    createdAt: iso(hoursAgo),
    bonusApplied: false,
    bonusMultiplier: 1,
    leveledUp: false,
    currentStreak: 1,
    streakMultiplier: 1,
    reviewStatus: status,
    nameResolution: null,
    ...over,
  };
}

const envelope = (content: ActivityLogResponse[], page = 0, total = content.length): LogPage => ({
  content,
  page,
  size: 50,
  totalElements: total,
  totalPages: Math.max(1, Math.ceil(total / 50)),
  sort: 'startTime,desc',
});

type Mocks = {
  /** Rows for a request; default is three logs from today. */
  page?: (params: URLSearchParams) => LogPage;
  byId?: Record<number, ActivityLogResponse>;
  status?: number;
};

function mockHistory(m: Mocks = {}) {
  const requests: URLSearchParams[] = [];
  server.use(
    http.get('*/api/activitylog/user/:id', ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      if (m.status) return HttpResponse.json({ detail: 'History is down' }, { status: m.status });
      return HttpResponse.json(
        m.page?.(params) ??
          envelope([log(1, 1, 40), log(2, 3, 62, 'APPROVED', studying), log(3, 5, 106, 'FLAGGED')]),
      );
    }),
    http.get('*/api/activitylog/:id', ({ params }) => {
      const row = m.byId?.[Number(params.id)];
      return row
        ? HttpResponse.json(row)
        : HttpResponse.json({ detail: 'No such log' }, { status: 404 });
    }),
    http.get('*/api/activity/', () => HttpResponse.json([running, studying])),
  );
  return requests;
}

function renderHistory(path = '/app/history') {
  signIn(ME, 'USER');
  return renderRoutes(
    [
      {
        path: '/app/history',
        element: <HistoryPage />,
        children: [{ path: ':logId', element: <LogDetailPage /> }],
      },
      { path: '/app/log', element: <p>log page</p> },
    ],
    path,
  );
}

describe('History — the list', () => {
  it('asks for the first 50, newest first, and groups them by day with a total', async () => {
    const requests = mockHistory();
    renderHistory();

    expect(await screen.findByRole('heading', { name: /^Today/ })).toBeInTheDocument();
    const first = requests[0];
    expect(first?.get('page')).toBe('0');
    expect(first?.get('size')).toBe('50');
    expect(first?.get('sort')).toBe('startTime,desc');
    expect(first?.has('activityId')).toBe(false);
    expect(first?.has('from')).toBe(false);

    expect(screen.getByText('3 logs, newest first.')).toBeInTheDocument();
    // Held XP is not in the day's total: 40 + 62 counted, 106 on hold.
    expect(screen.getByText('+102 XP')).toBeInTheDocument();
    expect(screen.getAllByText('Running').length).toBe(2 + 1); // two logs, plus the catalog option
  });

  it('shows a pill only when a log is not cleared, and words the XP by status', async () => {
    mockHistory({
      page: () =>
        envelope([
          log(1, 1, 40, 'CLEARED'),
          log(2, 2, 62, 'APPROVED'),
          log(3, 3, 106, 'FLAGGED'),
          log(4, 4, 80, 'REJECTED'),
        ]),
    });
    renderHistory();

    const list = await screen.findByRole('list', { name: 'Logs on Today' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows[0]).toHaveTextContent('+40 XP');
    expect(
      within(rows[0] as HTMLElement).queryByText(/Cleared|Pending|Approved|Rejected/),
    ).toBeNull();
    expect(rows[1]).toHaveTextContent('Approved');
    expect(rows[1]).toHaveTextContent('+62 XP');
    expect(rows[2]).toHaveTextContent('Pending');
    expect(rows[2]).toHaveTextContent('106 XP on hold');
    expect(rows[3]).toHaveTextContent('Rejected');
    expect(rows[3]).toHaveTextContent('0 XP');
  });

  it('shows 50 more with Show more until the last page', async () => {
    const requests = mockHistory({
      page: (p) => {
        const page = Number(p.get('page'));
        const count = page === 0 ? 50 : 10;
        return envelope(
          Array.from({ length: count }, (_, i) => log(page * 50 + i + 1, 1 + i * 0.1, 10)),
          page,
          60,
        );
      },
    });
    renderHistory();

    await screen.findByRole('heading', { name: /^Today/ });
    expect(screen.getByText('60 logs, newest first.')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /Running/ })).toHaveLength(50);

    await userEvent.click(screen.getByRole('button', { name: 'Show more' }));
    await waitFor(() => expect(screen.getAllByRole('link', { name: /Running/ })).toHaveLength(60));
    expect(requests.map((r) => r.get('page'))).toEqual(['0', '1']);
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
    // One day stays one group across pages.
    expect(screen.getAllByRole('heading', { name: /^Today/ })).toHaveLength(1);
  });
});

describe('History — filters', () => {
  it('sends the chosen activity and range to the server and keeps them in the URL', async () => {
    const requests = mockHistory();
    const { router } = renderHistory();
    await screen.findByRole('heading', { name: /^Today/ });

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Activity' }), 'Studying');
    await waitFor(() => expect(requests.at(-1)?.get('activityId')).toBe('12'));
    expect(router.state.location.search).toBe('?activity=12');

    await userEvent.click(screen.getByRole('radio', { name: '30 days' }));
    await waitFor(() => expect(requests.at(-1)?.get('from')).toBe(rangeStart(30)));
    expect(requests.at(-1)?.get('activityId')).toBe('12');
    expect(router.state.location.search).toBe('?activity=12&range=30');
    expect(screen.getByRole('radio', { name: '30 days' })).toBeChecked();
  });

  it('applies filters that are already in the URL', async () => {
    const requests = mockHistory();
    renderHistory('/app/history?activity=12&range=7');

    await screen.findByRole('heading', { name: /^Today/ });
    expect(requests[0]?.get('activityId')).toBe('12');
    expect(requests[0]?.get('from')).toBe(rangeStart(7));
    expect(screen.getByRole('combobox', { name: 'Activity' })).toHaveValue('12');
    expect(screen.getByRole('radio', { name: '7 days' })).toBeChecked();
    expect(screen.getByText('3 logs match, newest first.')).toBeInTheDocument();
  });

  it('invites a first log when there are none', async () => {
    mockHistory({ page: () => envelope([]) });
    renderHistory();

    expect(await screen.findByText('No logs yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log activity' })).toHaveAttribute('href', '/app/log');
  });

  it('offers to clear filters when they match nothing', async () => {
    mockHistory({ page: () => envelope([]) });
    const { router } = renderHistory('/app/history?activity=12&range=7');

    expect(await screen.findByText('No logs for these filters')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('link', { name: 'Clear filters' }));
    await waitFor(() => expect(router.state.location.search).toBe(''));
  });

  it('shows an error with a retry', async () => {
    mockHistory({ status: 500 });
    renderHistory();
    expect(await screen.findByText("Couldn't load your history")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('History — log details', () => {
  const byId = {
    1: log(1, 1, 40, 'CLEARED', running, { notes: 'Felt good.', streakMultiplier: 1.2 }),
    3: log(3, 5, 106, 'FLAGGED'),
    4: log(4, 6, 80, 'REJECTED'),
  };

  it('opens a sheet over the list with the receipt and notes, and closes with the filters kept', async () => {
    mockHistory({ byId });
    const { router } = renderHistory('/app/history?range=30');

    await userEvent.click(
      (await screen.findAllByRole('link', { name: /Running/ }))[0] as HTMLElement,
    );
    expect(router.state.location.pathname).toBe('/app/history/1');
    expect(router.state.location.search).toBe('?range=30');

    const sheet = await screen.findByRole('dialog', { name: 'Log details' });
    expect(await within(sheet).findByText('Activity logged')).toBeInTheDocument();
    expect(within(sheet).getByText('Felt good.')).toBeInTheDocument();
    expect(within(sheet).getByText('×1.2 streak')).toBeInTheDocument();
    // The list is still there behind it.
    expect(screen.getByRole('heading', { name: 'History', level: 1 })).toBeInTheDocument();

    fireEvent(sheet, new Event('close'));
    await waitFor(() => expect(router.state.location.pathname).toBe('/app/history'));
    expect(router.state.location.search).toBe('?range=30');
  });

  it('explains a log that is waiting for review and one that was rejected', async () => {
    mockHistory({ byId });
    renderHistory('/app/history/3');
    expect(
      await screen.findByText('An admin is reviewing this unusually long session.'),
    ).toBeInTheDocument();
    expect(screen.getByText('XP on hold')).toBeInTheDocument();
  });

  it('says no XP was awarded for a rejected log', async () => {
    mockHistory({ byId });
    renderHistory('/app/history/4');
    expect(await screen.findByText('No XP awarded.')).toBeInTheDocument();
  });

  it('shows an error when the log cannot be loaded', async () => {
    mockHistory({ byId });
    renderHistory('/app/history/999');
    expect(await screen.findByText("Couldn't load this log")).toBeInTheDocument();
  });
});
