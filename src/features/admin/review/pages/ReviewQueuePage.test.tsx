import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { useToastStore } from '@/components/ui/toastStore';
import AdminLayout from '@/app/layouts/AdminLayout';
import type { ActivityLogResponse } from '@/features/log-activity/types';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import type { Basis, ReviewItem } from '../types';
import ReviewQueuePage from './ReviewQueuePage';

function item(
  id: number,
  over: {
    userId?: number;
    minutes?: number;
    median?: number;
    sample?: number;
    basis?: Basis;
    z?: number;
    name?: string;
    notes?: string | null;
  } = {},
): ReviewItem {
  const log: ActivityLogResponse = {
    id,
    userId: over.userId ?? 4000 + id,
    activity: {
      id: 11,
      name: over.name ?? 'Studying',
      category: 'STUDY',
      xpMultiplier: 1.5,
      active: true,
      description: null,
      createdAt: '2026-10-01T00:00:00',
    },
    startTime: '2026-10-22T03:00:00',
    endTime: '2026-10-22T06:36:00',
    durationMinutes: over.minutes ?? 216,
    xpEarned: 475,
    notes: over.notes ?? null,
    createdAt: '2026-10-22T06:36:00',
    bonusApplied: false,
    bonusMultiplier: 1,
    leveledUp: false,
    currentStreak: 1,
    streakMultiplier: 1,
    reviewStatus: 'FLAGGED',
    nameResolution: null,
  };
  return {
    activityLog: log,
    modifiedZScore: over.z ?? 6.2,
    median: over.median ?? 45,
    sampleSize: over.sample ?? 12,
    basis: over.basis ?? 'MODIFIED_Z_SCORE',
  };
}

type Mocks = {
  rows?: ReviewItem[];
  status?: number;
  /** Status to answer a decision with instead of 200. */
  decideStatus?: number;
};

function mockQueue(m: Mocks = {}) {
  let rows = m.rows ?? [
    item(1),
    item(2, { basis: 'RELATIVE_FALLBACK', sample: 3, median: 60, minutes: 480, z: 0 }),
    item(3, { basis: 'INSUFFICIENT_SAMPLES', sample: 1, median: 0, z: 0 }),
  ];
  const calls = { list: 0, decisions: [] as string[] };
  server.use(
    http.get('*/api/activitylog/review/flagged', () => {
      calls.list += 1;
      if (m.status) return HttpResponse.json({ detail: 'Queue is down' }, { status: m.status });
      return HttpResponse.json(rows.filter((r) => r.activityLog.reviewStatus === 'FLAGGED'));
    }),
    http.post('*/api/activitylog/review/:id/:decision', ({ params }) => {
      calls.decisions.push(`${params.decision}:${params.id}`);
      if (m.decideStatus) {
        return HttpResponse.json({ detail: 'Not flagged' }, { status: m.decideStatus });
      }
      const status = params.decision === 'approve' ? 'APPROVED' : 'REJECTED';
      rows = rows.map((r) =>
        r.activityLog.id === Number(params.id)
          ? { ...r, activityLog: { ...r.activityLog, reviewStatus: status as 'APPROVED' } }
          : r,
      );
      return HttpResponse.json(
        rows.find((r) => r.activityLog.id === Number(params.id))?.activityLog,
      );
    }),
  );
  return calls;
}

function renderQueue() {
  signIn(1, 'ADMIN');
  return renderRoutes(
    [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [{ path: 'review', element: <ReviewQueuePage /> }],
      },
      { path: '/app', element: <p>app home</p> },
    ],
    '/admin/review',
  );
}

const rowFor = (name: RegExp | string) => screen.getByText(name).closest('tr') as HTMLElement;

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe('Review queue — the evidence', () => {
  it('shows each session with why it was flagged, next to its buttons', async () => {
    mockQueue();
    renderQueue();

    const row = await screen.findByText('User #4001').then((el) => el.closest('tr') as HTMLElement);
    expect(within(row).getByText('Studying')).toBeInTheDocument();
    expect(within(row).getByText('3 h 36 min')).toBeInTheDocument();
    expect(within(row).getByText('475 XP')).toBeInTheDocument();
    expect(within(row).getByText('4.8× their usual 45 min')).toBeInTheDocument();
    expect(within(row).getByText('based on 12 past sessions')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /^Approve/ })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: /^Reject/ })).toBeInTheDocument();
    expect(within(row).getByText(/Severity \d+% of the worst in the queue/)).toBeInTheDocument();
  });

  it('says rough estimate where the history is thin', async () => {
    mockQueue();
    renderQueue();

    expect(await screen.findByText('rough estimate from 3 past sessions')).toBeInTheDocument();
    expect(screen.getByText('few past sessions, rough estimate')).toBeInTheDocument();
    expect(screen.getByText('Very long for one session')).toBeInTheDocument();
  });

  it('shows how many sessions wait, on the page and on the rail', async () => {
    mockQueue();
    renderQueue();

    expect(await screen.findByText('3 sessions wait for a decision.')).toBeInTheDocument();
    expect((await screen.findAllByLabelText('3 waiting')).length).toBeGreaterThan(0);
  });

  it('says the queue is clear when nothing waits', async () => {
    mockQueue({ rows: [] });
    renderQueue();

    expect(await screen.findByText('Queue clear')).toBeInTheDocument();
    expect(screen.getAllByText(/No sessions need review/).length).toBeGreaterThan(0);
  });

  it('shows an error with a retry', async () => {
    mockQueue({ status: 500 });
    renderQueue();
    expect(await screen.findByText("Couldn't load the review queue")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('Review queue — deciding', () => {
  it('approves from the row and shows the result there, with the other rows untouched', async () => {
    const calls = mockQueue();
    renderQueue();

    const row = (await screen.findByText('User #4001')).closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: /^Approve/ }));

    await waitFor(() => expect(calls.decisions).toEqual(['approve:1']));
    expect(await within(row).findByText('Approved, 475 XP released')).toBeInTheDocument();
    expect(within(row).queryByRole('button', { name: /^Approve/ })).not.toBeInTheDocument();
    expect(
      within(rowFor('User #4002')).getByRole('button', { name: /^Approve/ }),
    ).toBeInTheDocument();
    expect(await screen.findByText('2 sessions wait for a decision.')).toBeInTheDocument();
  });

  it('asks before rejecting, and rejects only when confirmed', async () => {
    const calls = mockQueue();
    renderQueue();

    const row = (await screen.findByText('User #4001')).closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: /^Reject/ }));
    expect(within(row).getByText('Reject? This session gets no XP.')).toBeInTheDocument();
    expect(calls.decisions).toEqual([]);

    await userEvent.click(within(row).getByRole('button', { name: 'Cancel' }));
    expect(within(row).queryByText('Reject? This session gets no XP.')).not.toBeInTheDocument();
    expect(calls.decisions).toEqual([]);

    await userEvent.click(within(row).getByRole('button', { name: /^Reject/ }));
    await userEvent.click(within(row).getByRole('button', { name: 'Reject' }));
    await waitFor(() => expect(calls.decisions).toEqual(['reject:1']));
    expect(await within(row).findByText('Rejected, no XP awarded')).toBeInTheDocument();
  });

  it('says so and refreshes when the session was already decided', async () => {
    const calls = mockQueue({ decideStatus: 409 });
    renderQueue();

    const row = (await screen.findByText('User #4001')).closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: /^Approve/ }));

    await waitFor(() =>
      expect(useToastStore.getState().toasts.map((t) => t.message)).toContain(
        'That session was already decided.',
      ),
    );
    await waitFor(() => expect(calls.list).toBeGreaterThanOrEqual(2));
  });

  it('shows an error toast when the decision fails', async () => {
    mockQueue({ decideStatus: 500 });
    renderQueue();

    const row = (await screen.findByText('User #4001')).closest('tr') as HTMLElement;
    await userEvent.click(within(row).getByRole('button', { name: /^Approve/ }));
    await waitFor(() =>
      expect(useToastStore.getState().toasts.map((t) => t.message)).toContain(
        "Couldn't save that decision. Try again.",
      ),
    );
  });
});

describe('Review queue — from the keyboard', () => {
  it('moves with the arrows, approves with A and moves on to the next row', async () => {
    const calls = mockQueue();
    renderQueue();

    await screen.findByText('User #4001');
    screen.getByRole('group', { name: 'Flagged sessions' }).focus();
    expect(rowFor('User #4001')).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('{ArrowDown}');
    expect(rowFor('User #4002')).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowUp}');
    expect(rowFor('User #4001')).toHaveAttribute('aria-selected', 'true');

    await userEvent.keyboard('a');
    await waitFor(() => expect(calls.decisions).toEqual(['approve:1']));
    await waitFor(() => expect(rowFor('User #4002')).toHaveAttribute('aria-selected', 'true'));
  });

  it('rejects with R then Enter, and Escape backs out', async () => {
    const calls = mockQueue();
    renderQueue();

    await screen.findByText('User #4001');
    screen.getByRole('group', { name: 'Flagged sessions' }).focus();

    await userEvent.keyboard('r');
    expect(screen.getByText('Reject? This session gets no XP.')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByText('Reject? This session gets no XP.')).not.toBeInTheDocument();
    expect(calls.decisions).toEqual([]);

    await userEvent.keyboard('r');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(calls.decisions).toEqual(['reject:1']));
  });
});

describe('Review queue — the side panel', () => {
  it('opens the evidence for a row, and decides from it', async () => {
    const calls = mockQueue({
      rows: [item(1, { notes: 'Long study day before the exam.' })],
    });
    renderQueue();

    await userEvent.click((await screen.findByText('User #4001')).closest('tr') as HTMLElement);
    const panel = await screen.findByRole('dialog', { name: 'Review session' });
    expect(within(panel).getByText('4.8× their usual 45 min')).toBeInTheDocument();
    expect(within(panel).getByText('Their usual')).toBeInTheDocument();
    expect(within(panel).getByText('This session')).toBeInTheDocument();
    expect(within(panel).getByText('Long study day before the exam.')).toBeInTheDocument();
    expect(within(panel).getByText('XP on hold')).toBeInTheDocument();

    await userEvent.click(within(panel).getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(calls.decisions).toEqual(['approve:1']));
    expect(await within(panel).findByText('XP released.')).toBeInTheDocument();
  });
});
