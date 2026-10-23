import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { useToastStore } from '@/components/ui/toastStore';
import type { CatalogActivity, Threshold } from '@/features/activities/types';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import LevelingRulesPage from './LevelingRulesPage';

const act = (id: number, name: string, active = true): CatalogActivity => ({
  id,
  name,
  category: 'STUDY',
  xpMultiplier: 1.5,
  active,
  description: null,
  createdAt: '2026-10-01T00:00:00',
});

const catalog = [act(11, 'Running'), act(12, 'Studying'), act(13, 'Archery', false)];

const t = (activityId: number, level: number, xpRequired: number): Threshold => ({
  activityId,
  level,
  xpRequired,
});

/** Studying has its own curve; Running has no rows, so it runs on the default curve. */
const seed = [t(12, 1, 0), t(12, 2, 120), t(12, 3, 360), t(12, 4, 720)];

type Mocks = {
  rows?: Threshold[];
  writeStatus?: number;
  writeDetail?: string;
};

function mockLeveling(m: Mocks = {}) {
  const calls = {
    saved: [] as Threshold[],
    updated: [] as { activityId: string; level: string; body: object }[],
    deleted: [] as string[],
    ladderAsked: [] as string[],
  };
  const fail = () =>
    HttpResponse.json(
      { status: m.writeStatus, detail: m.writeDetail ?? 'Rejected' },
      { status: m.writeStatus },
    );
  server.use(
    http.get('*/api/activity', () => HttpResponse.json(catalog)),
    http.get('*/api/threshold', () => HttpResponse.json(m.rows ?? seed)),
    http.get('*/api/threshold/activity/:id', ({ params, request }) => {
      const upTo = new URL(request.url).searchParams.get('upToLevel') ?? '10';
      calls.ladderAsked.push(`${params.id}:${upTo}`);
      // The effective ladder: the default curve (100 per level, rising) when there are no rows.
      return HttpResponse.json(
        Array.from({ length: Number(upTo) }, (_, i) =>
          t(Number(params.id), i + 1, 50 * i * (i + 1)),
        ),
      );
    }),
    http.post('*/api/threshold', async ({ request }) => {
      if (m.writeStatus) return fail();
      const body = (await request.json()) as Threshold;
      calls.saved.push(body);
      return HttpResponse.json(body);
    }),
    http.put('*/api/threshold/:activityId/:level', async ({ params, request }) => {
      if (m.writeStatus) return fail();
      calls.updated.push({
        activityId: String(params.activityId),
        level: String(params.level),
        body: (await request.json()) as object,
      });
      return HttpResponse.json({});
    }),
    http.delete('*/api/threshold/:activityId/:level', ({ params }) => {
      if (m.writeStatus) return fail();
      calls.deleted.push(`${params.activityId}:${params.level}`);
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return calls;
}

function renderLeveling(path = '/admin/leveling?activity=12') {
  signIn(1, 'ADMIN');
  return renderRoutes([{ path: '/admin/leveling', element: <LevelingRulesPage /> }], path);
}

const messages = () => useToastStore.getState().toasts.map((t) => t.message);

async function fill(label: string, value: string) {
  const input = screen.getByLabelText(label);
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe('Leveling rules — the ladder', () => {
  it('shows an activity own levels, what each adds, and that it is a custom curve', async () => {
    mockLeveling();
    renderLeveling();

    expect(await screen.findByText('A custom curve of 4 levels.')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Level ladder' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(5);
    expect(rows[2]).toHaveTextContent('Level 2');
    expect(rows[2]).toHaveTextContent('120');
    expect(rows[2]).toHaveTextContent('+120');
    expect(rows[3]).toHaveTextContent('+240');
    expect(
      screen.getByRole('img', {
        name: /XP needed by level, from level 1 \(0 XP\) to level 4 \(720 XP\)/,
      }),
    ).toBeInTheDocument();
    expect(within(table).getByRole('button', { name: 'Edit level 2' })).toBeInTheDocument();
  });

  it('shows the default curve read-only, and says it is not stored', async () => {
    const calls = mockLeveling();
    renderLeveling('/admin/leveling?activity=11');

    expect(
      await screen.findByText(/Using the default curve\. Adding a level replaces it/),
    ).toBeInTheDocument();
    await waitFor(() => expect(calls.ladderAsked).toContain('11:12'));
    const table = await screen.findByRole('table', { name: 'Level ladder' });
    await within(table).findByText('Level 12');
    expect(within(table).queryByRole('button', { name: /^Edit level/ })).not.toBeInTheDocument();
    expect(within(table).queryByRole('button', { name: /^Delete level/ })).not.toBeInTheDocument();
  });

  it('switches activity from the list and keeps it in the URL', async () => {
    mockLeveling();
    const { router } = renderLeveling();
    await screen.findByText('A custom curve of 4 levels.');

    await userEvent.click(
      within(screen.getByRole('navigation', { name: 'Activities' })).getByRole('button', {
        name: 'Running',
      }),
    );
    await waitFor(() => expect(router.state.location.search).toBe('?activity=11'));
    expect(await screen.findByText(/Using the default curve/)).toBeInTheDocument();
  });

  it('shows an error with a retry when it cannot load', async () => {
    server.use(
      http.get('*/api/activity', () => HttpResponse.json(catalog)),
      http.get('*/api/threshold', () => HttpResponse.json({ detail: 'Down' }, { status: 500 })),
    );
    renderLeveling();
    expect(await screen.findByText("Couldn't load the leveling rules")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('Leveling rules — adding a level', () => {
  it('checks the curve rule as you type, with the server wording, and will not submit it', async () => {
    const calls = mockLeveling();
    renderLeveling();
    await screen.findByText('A custom curve of 4 levels.');

    await fill('Level', '5');
    await fill('XP required', '700');
    expect(
      screen.getByText('Level 5 must need more XP than level 4 (720), but got 700'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add level' })).toBeDisabled();
    expect(calls.saved).toEqual([]);
  });

  it('asks before it saves, and saves only when confirmed', async () => {
    const calls = mockLeveling();
    renderLeveling();
    await screen.findByText('A custom curve of 4 levels.');

    await fill('Level', '5');
    await fill('XP required', '1500');
    await userEvent.click(screen.getByRole('button', { name: 'Add level' }));

    const dialog = await screen.findByRole('alertdialog', { name: 'Confirm the change' });
    expect(dialog).toHaveTextContent(
      'This changes level progress for everyone who logs Studying, the next time they earn XP. Continue?',
    );
    expect(within(dialog).getByText('Level 5 needs 1,500 XP.')).toBeInTheDocument();
    expect(calls.saved).toEqual([]);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }));
    await waitFor(() =>
      expect(calls.saved).toEqual([{ activityId: 12, level: 5, xpRequired: 1500 }]),
    );
    await waitFor(() => expect(messages()).toContain('Added level 5'));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Level')).toHaveValue(null);
  });

  it('can be cancelled without saving', async () => {
    const calls = mockLeveling();
    renderLeveling();
    await screen.findByText('A custom curve of 4 levels.');

    await fill('Level', '5');
    await fill('XP required', '1500');
    await userEvent.click(screen.getByRole('button', { name: 'Add level' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(calls.saved).toEqual([]);
  });

  it('warns that adding to a default-curve activity replaces the curve', async () => {
    mockLeveling();
    renderLeveling('/admin/leveling?activity=11');
    await screen.findByText(/Using the default curve/);

    await fill('Level', '2');
    await fill('XP required', '150');
    await userEvent.click(screen.getByRole('button', { name: 'Add level' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByText(
        /Running uses the default curve\. After this it uses only the levels you add\./,
      ),
    ).toBeInTheDocument();
  });

  it('says it replaces a level that already exists', async () => {
    mockLeveling();
    renderLeveling();
    await screen.findByText('A custom curve of 4 levels.');

    await fill('Level', '3');
    await fill('XP required', '400');
    await userEvent.click(screen.getByRole('button', { name: 'Add level' }));
    expect(
      await screen.findByText('Level 3 already needs 360 XP; this replaces it.'),
    ).toBeInTheDocument();
  });

  it('shows the server message when it rejects a change the page could not see', async () => {
    mockLeveling({
      writeStatus: 409,
      writeDetail: 'Level 5 must need more XP than level 4 (900.0), but got 800.0',
    });
    renderLeveling();
    await screen.findByText('A custom curve of 4 levels.');

    await fill('Level', '5');
    await fill('XP required', '1500');
    await userEvent.click(screen.getByRole('button', { name: 'Add level' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    expect(
      await screen.findByText(/must need more XP than level 4 \(900\.0\)/),
    ).toBeInTheDocument();
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});

describe('Leveling rules — editing and deleting', () => {
  it('edits a level in place after a confirm', async () => {
    const calls = mockLeveling();
    renderLeveling();

    await userEvent.click(await screen.findByRole('button', { name: 'Edit level 3' }));
    const field = screen.getByLabelText('XP required for level 3');
    await userEvent.clear(field);
    await userEvent.type(field, '400');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Continue' }));

    await waitFor(() =>
      expect(calls.updated).toEqual([{ activityId: '12', level: '3', body: { xpRequired: 400 } }]),
    );
    await waitFor(() => expect(messages()).toContain('Level 3 now needs 400 XP'));
  });

  it('rejects an edit that breaks the curve before it asks the server', async () => {
    const calls = mockLeveling();
    renderLeveling();

    await userEvent.click(await screen.findByRole('button', { name: 'Edit level 3' }));
    const field = screen.getByLabelText('XP required for level 3');
    await userEvent.clear(field);
    await userEvent.type(field, '100');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('Level 3 must need more XP than level 2 (120), but got 100'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(calls.updated).toEqual([]);
  });

  it('deletes a level after a confirm', async () => {
    const calls = mockLeveling();
    renderLeveling();

    await userEvent.click(await screen.findByRole('button', { name: 'Delete level 4' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Remove level 4.')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(calls.deleted).toEqual(['12:4']));
    await waitFor(() => expect(messages()).toContain('Removed level 4'));
  });

  it('says the activity goes back to the default curve when its last level is deleted', async () => {
    mockLeveling({ rows: [t(12, 1, 0)] });
    renderLeveling();

    await userEvent.click(await screen.findByRole('button', { name: 'Delete level 1' }));
    expect(
      await screen.findByText(
        'This is the last level, so Studying goes back to the default curve.',
      ),
    ).toBeInTheDocument();
  });

  it('shows an error toast when a change fails for another reason', async () => {
    mockLeveling({ writeStatus: 500 });
    renderLeveling();

    await userEvent.click(await screen.findByRole('button', { name: 'Delete level 4' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(messages()).toContain("Couldn't save that change. Try again."));
  });
});
