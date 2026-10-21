import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Streak } from '@/features/activities/types';
import type { LogOutcome } from '../outcome';
import type { WeeklyReport } from '@/features/stats/types';
import { qk } from '@/lib/api/queryKeys';
import { serverToday, toServerDateTime } from '@/lib/utils/serverTime';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import type { ActivityLogResponse } from '../types';
import LogResultPage from './LogResultPage';

const LOGGED_AT = new Date();

const baseLog: ActivityLogResponse = {
  id: 42,
  userId: 7,
  activity: {
    id: 5,
    name: 'Studying',
    category: 'STUDY',
    xpMultiplier: 1.5,
    active: true,
    description: null,
    createdAt: '2026-10-01T00:00:00',
  },
  startTime: toServerDateTime(new Date(LOGGED_AT.getTime() - 90 * 60_000)),
  endTime: toServerDateTime(LOGGED_AT),
  durationMinutes: 90,
  xpEarned: 135,
  notes: null,
  createdAt: toServerDateTime(LOGGED_AT),
  bonusApplied: false,
  bonusMultiplier: 1,
  leveledUp: false,
  currentStreak: 1,
  streakMultiplier: 1,
  reviewStatus: 'CLEARED',
  nameResolution: null,
};

const week: WeeklyReport = {
  currentWeekXp: 700,
  previousWeekXp: 500,
  percentageChange: 40,
  totalActiveMinutes: 300,
  topCategory: 'STUDY',
  dailyBreakdown: Array.from({ length: 7 }, (_, i) => ({
    date: serverToday(new Date(Date.now() - (6 - i) * 86_400_000)),
    totalXpEarned: 100,
    totalDurationMinutes: 60,
  })),
};

type Opts = {
  log?: ActivityLogResponse;
  /** Seed the cache like a just-finished POST, instead of fetching by id. */
  seeded?: boolean;
  /** Answers in order; the last one repeats. Default: always PENDING. */
  outcomes?: LogOutcome[];
  streaks?: Streak[];
};

function renderResult(opts: Opts = {}) {
  const log = opts.log ?? baseLog;
  const calls = { logById: 0, outcome: 0 };
  signIn(7, 'USER');
  server.use(
    http.get('*/api/activitylog/:id', () => {
      calls.logById += 1;
      return HttpResponse.json(log);
    }),
    http.get('*/api/activitylog/:id/outcome', () => {
      const answers = opts.outcomes ?? [PENDING];
      const answer = answers[Math.min(calls.outcome, answers.length - 1)];
      calls.outcome += 1;
      return HttpResponse.json(answer);
    }),
    http.get('*/api/activitylog/streaks/user/:id', () =>
      HttpResponse.json(
        opts.streaks ?? [
          {
            activityId: 5,
            currentStreak: 6,
            longestStreak: 9,
            lastActivityDate: serverToday(),
            active: true,
          },
        ],
      ),
    ),
    http.get('*/api/activitylog/analytics/user/:id/weekly-report', () => HttpResponse.json(week)),
    http.get('*/api/ranks/me', () =>
      HttpResponse.json({
        tier: 'ALPINE',
        overallLevel: 7,
        totalXp: 1234,
        percentile: 0.25,
        position: 30,
        totalUsers: 120,
        updatedAt: '2026-10-19T10:00:00',
      }),
    ),
  );
  renderRoutes(
    [{ path: '/app/log/result/:logId', element: <LogResultPage /> }],
    `/app/log/result/${log.id}`,
    opts.seeded ? (qc) => qc.setQueryData(qk.activityLog.byId(log.id), log) : undefined,
  );
  return calls;
}

const PENDING: LogOutcome = {
  status: 'PENDING',
  xpApplied: null,
  leveledUp: null,
  newLevel: null,
  previousLevel: null,
};
const applied = (overrides: Partial<LogOutcome> = {}): LogOutcome => ({
  status: 'APPLIED',
  xpApplied: 135,
  leveledUp: true,
  newLevel: 8,
  previousLevel: 7,
  ...overrides,
});

describe('Log Result — outcomes', () => {
  it('celebrates a cleared log with the XP counting up to the total', async () => {
    renderResult({ seeded: true });

    expect(await screen.findByRole('heading', { name: 'Activity logged' })).toBeInTheDocument();
    expect(await screen.findByText('+135 XP', {}, { timeout: 10_000 })).toBeInTheDocument();
    expect(screen.getAllByText('Studying').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'Done' })).toHaveAttribute('href', '/app');
    expect(screen.getByRole('link', { name: 'Log another' })).toHaveAttribute('href', '/app/log');
  });

  it('uses the response cached by the save instead of refetching it', async () => {
    const calls = renderResult({ seeded: true });
    await screen.findByRole('heading', { name: 'Activity logged' });
    expect(calls.logById).toBe(0);
  });

  it('falls back to fetching the log by id on a fresh page load', async () => {
    const calls = renderResult({ seeded: false });
    await screen.findByRole('heading', { name: 'Activity logged' });
    expect(calls.logById).toBe(1);
  });

  it('switches to the level-up header, with the activity levels, once the XP is applied', async () => {
    renderResult({ seeded: true, outcomes: [applied()] });

    expect(await screen.findByRole('heading', { name: 'Level 8!' })).toBeInTheDocument();
    expect(screen.getByText('Studying: level 7 → 8')).toBeInTheDocument();
  });

  it('keeps asking while the XP is still being applied, then shows the level-up', async () => {
    const calls = renderResult({ seeded: true, outcomes: [PENDING, applied()] });

    expect(await screen.findByRole('heading', { name: 'Activity logged' })).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Level 8!' }, { timeout: 8_000 }),
    ).toBeInTheDocument();
    expect(calls.outcome).toBe(2);
  });

  it('stays on the plain header when the XP was applied without a level-up', async () => {
    const calls = renderResult({
      seeded: true,
      outcomes: [applied({ leveledUp: false, newLevel: 7, previousLevel: 7 })],
    });

    await screen.findByRole('heading', { name: 'Activity logged' });
    await waitFor(() => expect(calls.outcome).toBe(1));
    expect(screen.queryByRole('heading', { name: /Level \d+!/ })).not.toBeInTheDocument();
  });

  it('shows pending review calmly: XP on hold, only Done, and never asks for an outcome', async () => {
    const calls = renderResult({
      seeded: true,
      log: { ...baseLog, reviewStatus: 'FLAGGED', xpEarned: 1200 },
    });

    expect(await screen.findByRole('heading', { name: 'Saved — XP on hold' })).toBeInTheDocument();
    expect(screen.getAllByText('1,200 XP on hold').length).toBeGreaterThan(0);
    expect(screen.getByText(/admin will review it/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Done' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log another' })).not.toBeInTheDocument();
    expect(screen.queryByText(/^\+.* XP$/)).not.toBeInTheDocument(); // no success counter
    expect(calls.outcome).toBe(0);
  });

  it('says no XP was awarded for a rejected log', async () => {
    renderResult({ seeded: true, log: { ...baseLog, reviewStatus: 'REJECTED' } });
    expect(await screen.findByRole('heading', { name: 'No XP awarded' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Log another' })).not.toBeInTheDocument();
  });

  it('explains a missing log instead of crashing', async () => {
    signIn(7, 'USER');
    server.use(
      http.get('*/api/activitylog/:id', () =>
        HttpResponse.json({ detail: 'Not found' }, { status: 404 }),
      ),
    );
    renderRoutes(
      [{ path: '/app/log/result/:logId', element: <LogResultPage /> }],
      '/app/log/result/9',
    );
    expect(await screen.findByText("We couldn't find that log")).toBeInTheDocument();
  });
});

describe('Log Result — receipt and analytics', () => {
  it('shows the bonus and streak multipliers that applied', async () => {
    renderResult({
      seeded: true,
      log: { ...baseLog, bonusApplied: true, bonusMultiplier: 1.25, streakMultiplier: 1.2 },
    });
    expect(await screen.findByText('×1.25 bonus')).toBeInTheDocument();
    expect(screen.getByText('×1.2 streak')).toBeInTheDocument();
  });

  it('shows the live streak and the best streak for this activity', async () => {
    renderResult({ seeded: true });
    expect(await screen.findByText('6-day streak')).toBeInTheDocument();
    expect(screen.getByText('Longest on Studying: 9 days')).toBeInTheDocument();
  });

  it('shows my tier and position, with the "refreshes about every 30 seconds" caveat', async () => {
    renderResult({ seeded: true });
    expect(await screen.findByText('Alpine')).toBeInTheDocument();
    expect(screen.getByText(/#30 of 120/)).toBeInTheDocument();
    expect(screen.getByText(/Ranks refresh about every 30 seconds/)).toBeInTheDocument();
  });
});
