import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Outlet, useParams } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { CatalogActivity } from '@/features/activities/types';
import { fromServerDateTime } from '@/lib/utils/serverTime';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import type { ActivityLogRequest, ActivityLogResponse, NaturalLogDraftResponse } from '../types';
import LogActivitySheet from './LogActivitySheet';

const catalog: CatalogActivity[] = [
  {
    id: 1,
    name: 'Studying',
    category: 'STUDY',
    xpMultiplier: 0,
    active: true,
    description: null,
    createdAt: '2026-10-01T00:00:00',
  },
  {
    id: 2,
    name: 'Running',
    category: 'HEALTH',
    xpMultiplier: 0,
    active: true,
    description: null,
    createdAt: '2026-10-01T00:00:00',
  },
];

function saved(req: ActivityLogRequest): ActivityLogResponse {
  return {
    id: 42,
    userId: 7,
    activity: { ...catalog[0]!, xpMultiplier: 1.5 },
    startTime: req.startTime,
    endTime: req.endTime,
    durationMinutes: 60,
    xpEarned: 90,
    notes: req.notes ?? null,
    createdAt: req.endTime,
    bonusApplied: false,
    bonusMultiplier: 1,
    leveledUp: false,
    currentStreak: 1,
    streakMultiplier: 1,
    reviewStatus: 'CLEARED',
    nameResolution: null,
  };
}

function ResultProbe() {
  const { logId } = useParams();
  return <p>result page {logId}</p>;
}

function renderSheet(entry = '/app/log') {
  signIn(7, 'USER');
  server.use(http.get('*/api/activity', () => HttpResponse.json(catalog)));
  return renderRoutes(
    [
      {
        path: '/app',
        element: (
          <>
            <p>home behind</p>
            <Outlet />
          </>
        ),
        children: [{ path: 'log', element: <LogActivitySheet /> }],
      },
      { path: '/app/log/result/:logId', element: <ResultProbe /> },
    ],
    entry,
  );
}

/** Captures the body of every POST /api/activitylog/ and answers with `reply`. */
function captureSave(
  reply: (req: ActivityLogRequest) => Response | ReturnType<typeof HttpResponse.json>,
) {
  const bodies: ActivityLogRequest[] = [];
  server.use(
    http.post('*/api/activitylog/', async ({ request }) => {
      const body = (await request.json()) as ActivityLogRequest;
      bodies.push(body);
      return reply(body);
    }),
  );
  return bodies;
}

function natural(res: Partial<NaturalLogDraftResponse>) {
  server.use(
    http.post('*/api/activitylog/natural', () =>
      HttpResponse.json({
        draft: null,
        interpretation: null,
        status: 'PARSED',
        nameResolution: null,
        suggestions: null,
        ...res,
      }),
    ),
  );
}

async function pickActivity(name: string) {
  const box = screen.getByRole('combobox', { name: 'Activity' });
  await userEvent.click(box);
  await userEvent.click(await screen.findByRole('option', { name: new RegExp(name) }));
}

describe('Log Activity — structured form', () => {
  it('reviews, then saves with UTC times where start = end − duration', async () => {
    const bodies = captureSave((req) => HttpResponse.json(saved(req)));
    renderSheet();

    await pickActivity('Studying');
    await userEvent.click(screen.getByRole('button', { name: '60 min' }));
    await userEvent.click(screen.getByRole('button', { name: 'Review' }));

    // Nothing is saved until the confirm card's "Log it".
    expect(bodies).toHaveLength(0);
    expect(await screen.findByText('Studying')).toBeInTheDocument();
    expect(screen.getByText('1 h')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Log it' }));

    expect(await screen.findByText('result page 42')).toBeInTheDocument();
    const body = bodies[0]!;
    expect(body.activityName).toBe('Studying');
    expect(body.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/); // zone-less UTC
    const start = fromServerDateTime(body.startTime).getTime();
    const end = fromServerDateTime(body.endTime).getTime();
    expect(end - start).toBe(60 * 60_000);
    expect(Math.abs(Date.now() - end)).toBeLessThan(2 * 60_000); // "Just now", read back as UTC
  });

  it('pre-fills the activity from ?activity=', async () => {
    renderSheet('/app/log?activity=Running');
    expect(screen.getByRole('combobox', { name: 'Activity' })).toHaveValue('Running');
  });

  it('asks for an activity before reviewing', async () => {
    renderSheet();
    await userEvent.click(screen.getByRole('button', { name: 'Review' }));
    expect(await screen.findByText('Choose or type an activity')).toBeInTheDocument();
  });
});

describe('Log Activity — natural language', () => {
  const draft: ActivityLogRequest = {
    activityName: 'Studying',
    startTime: '2026-10-19T07:30:00',
    endTime: '2026-10-19T09:00:00',
    notes: null,
  };

  it('previews a parsed sentence and saves exactly what was previewed', async () => {
    natural({ status: 'PARSED', draft, interpretation: 'Logged 90 min of Study, 7:30–9:00 today' });
    const bodies = captureSave((req) => HttpResponse.json(saved(req)));
    renderSheet();

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Tell us what you did' }),
      'Studied for 90 min this morning',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Understand it' }));

    expect(await screen.findByText(/Logged 90 min of Study/)).toBeInTheDocument();
    expect(bodies).toHaveLength(0); // still just a preview

    await userEvent.click(screen.getByRole('button', { name: 'Log it' }));
    expect(await screen.findByText('result page 42')).toBeInTheDocument();
    expect(bodies[0]).toMatchObject({ startTime: draft.startTime, endTime: draft.endTime });
  });

  it('shows the fuzzy match before saving and lets the user change it', async () => {
    natural({
      status: 'PARSED',
      draft: { ...draft, activityName: 'morning jog' },
      interpretation: 'Logged a run',
      nameResolution: { requestedName: 'morning jog', resolvedName: 'Running', score: 0.9 },
    });
    renderSheet();

    await userEvent.type(screen.getByRole('textbox', { name: 'Tell us what you did' }), 'jogged');
    await userEvent.click(screen.getByRole('button', { name: 'Understand it' }));

    const note = await screen.findByRole('status');
    expect(note).toHaveTextContent('Will be logged as Running (you typed morning jog)');

    await userEvent.click(within(note).getByRole('button', { name: 'Change' }));
    expect(screen.getByRole('combobox', { name: 'Activity' })).toHaveValue('morning jog');
  });

  it('asks a question when the sentence is unclear, and keeps the form available', async () => {
    natural({ status: 'NEEDS_CLARIFICATION', interpretation: 'How long did you study for?' });
    renderSheet();

    await userEvent.type(screen.getByRole('textbox', { name: 'Tell us what you did' }), 'studied');
    await userEvent.click(screen.getByRole('button', { name: 'Understand it' }));

    expect(await screen.findByText('How long did you study for?')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Activity' })).toBeInTheDocument();
  });

  it('hides the text box when AI logging is switched off', async () => {
    natural({ status: 'DISABLED' });
    renderSheet();

    await userEvent.type(screen.getByRole('textbox', { name: 'Tell us what you did' }), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Understand it' }));

    await screen.findByRole('combobox', { name: 'Activity' });
    expect(screen.queryByRole('textbox', { name: 'Tell us what you did' })).not.toBeInTheDocument();
  });

  it('says quick log is unavailable when the AI backend is down', async () => {
    natural({ status: 'UNAVAILABLE' });
    renderSheet();

    await userEvent.type(screen.getByRole('textbox', { name: 'Tell us what you did' }), 'x');
    await userEvent.click(screen.getByRole('button', { name: 'Understand it' }));

    expect(await screen.findByText(/Quick log is unavailable/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Tell us what you did' })).not.toBeInTheDocument();
  });
});

describe('Log Activity — rejected saves', () => {
  async function fillAndConfirm(name = 'Studying') {
    await userEvent.type(screen.getByRole('combobox', { name: 'Activity' }), name);
    await userEvent.click(screen.getByRole('button', { name: 'Review' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Log it' }));
  }

  it('offers "Did you mean…?" chips on an unmatched name and fills the one picked', async () => {
    captureSave(() =>
      HttpResponse.json(
        {
          detail: 'Activity not found: runing',
          requestedName: 'runing',
          suggestions: [
            { name: 'Running', category: 'HEALTH', active: true, score: 0.92, matchedOn: 'NAME' },
          ],
        },
        { status: 404 },
      ),
    );
    renderSheet();
    await fillAndConfirm('runing');

    const group = await screen.findByRole('group', { name: 'Did you mean' });
    await userEvent.click(within(group).getByRole('button', { name: /Running/ }));
    expect(screen.getByRole('combobox', { name: 'Activity' })).toHaveValue('Running');
  });

  it('shows a too-long session inline on the duration, not as a toast', async () => {
    captureSave(() =>
      HttpResponse.json(
        { detail: 'Session duration of 1500 minutes exceeds the maximum allowed 1440 minutes.' },
        { status: 400 },
      ),
    );
    renderSheet();
    await fillAndConfirm();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('exceeds the maximum allowed 1440 minutes');
    expect(screen.getByRole('spinbutton', { name: 'Minutes' })).toBeInTheDocument();
  });

  it('shows a future time inline on the Ended field', async () => {
    captureSave(() =>
      HttpResponse.json({ detail: 'end Time should be past or present' }, { status: 400 }),
    );
    renderSheet();
    await fillAndConfirm();

    expect(await screen.findByRole('alert')).toHaveTextContent(/in the future/i);
  });
});

describe('Log Activity — opened from Home with a sentence', () => {
  const draft: ActivityLogRequest = {
    activityName: 'Studying',
    startTime: '2026-10-19T07:30:00',
    endTime: '2026-10-19T09:00:00',
    notes: null,
  };

  it('runs the draft straight away and lands on the confirm card', async () => {
    natural({ status: 'PARSED', draft, interpretation: 'Logged 90 min of Study' });
    renderSheet('/app/log?text=Studied%20for%2090%20min');

    expect(await screen.findByText(/Logged 90 min of Study/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log it' })).toBeInTheDocument();
  });

  it('asks the backend exactly once', async () => {
    let calls = 0;
    server.use(
      http.post('*/api/activitylog/natural', () => {
        calls += 1;
        return HttpResponse.json({
          draft,
          interpretation: 'Logged 90 min of Study',
          status: 'PARSED',
          nameResolution: null,
          suggestions: null,
        });
      }),
    );
    renderSheet('/app/log?text=Studied%20for%2090%20min');

    await screen.findByText(/Logged 90 min of Study/);
    expect(calls).toBe(1);
  });

  it('keeps the sentence in the box when it needs more detail', async () => {
    natural({ status: 'NEEDS_CLARIFICATION', interpretation: 'How long did you study for?' });
    renderSheet('/app/log?text=Studied');

    expect(await screen.findByText('How long did you study for?')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Tell us what you did' })).toHaveValue('Studied');
  });
});
