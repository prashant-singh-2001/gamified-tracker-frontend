import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { useToastStore } from '@/components/ui/toastStore';
import type { CatalogActivity, LevelTracker } from '@/features/activities/types';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import SystemToolsPage from './SystemToolsPage';

const ME = 1;

const act = (id: number, name: string): CatalogActivity => ({
  id,
  name,
  category: 'STUDY',
  xpMultiplier: 1.5,
  active: true,
  description: null,
  createdAt: '2026-10-01T00:00:00',
});
const catalog = [act(11, 'Running'), act(12, 'Studying')];

const tracker = (userId: number, activityId: number, totalXp: number, level = 2): LevelTracker => ({
  userId,
  activityId,
  level,
  totalXp,
  currentLevelXp: 40,
  xpForNextLevel: 0,
  progressPercent: 100,
  leveledUp: false,
});

type Mocks = {
  trackers?: LevelTracker[];
  recompute?: 'slow' | number;
  awardStatus?: number;
  awardDetail?: string;
  levelsStatus?: number;
};

function mockSystem(m: Mocks = {}) {
  const calls = {
    levels: [] as string[],
    recompute: 0,
    awards: [] as object[],
  };
  const all = m.trackers ?? [tracker(42, 11, 900), tracker(142, 12, 1500), tracker(7, 11, 300)];
  let open: () => void = () => undefined;
  const gate = new Promise<void>((resolve) => (open = resolve));
  server.use(
    http.get('*/api/activity', () => HttpResponse.json(catalog)),
    http.get('*/api/level', () => {
      calls.levels.push('all');
      if (m.levelsStatus) return HttpResponse.json({ detail: 'Down' }, { status: m.levelsStatus });
      return HttpResponse.json(all);
    }),
    http.get('*/api/level/activity/:id', ({ params }) => {
      calls.levels.push(`activity:${params.id}`);
      return HttpResponse.json(all.filter((t) => t.activityId === Number(params.id)));
    }),
    http.post('*/api/ranks/recompute', async () => {
      calls.recompute += 1;
      if (m.recompute === 'slow') await gate;
      if (typeof m.recompute === 'number') {
        return HttpResponse.json({ detail: 'No' }, { status: m.recompute });
      }
      return HttpResponse.json({ rankedUsers: 240 });
    }),
    http.post('*/api/level', async ({ request }) => {
      const body = (await request.json()) as { xp: number; activityId: number };
      calls.awards.push(body);
      if (m.awardStatus) {
        return HttpResponse.json(
          { status: m.awardStatus, detail: m.awardDetail ?? 'No' },
          { status: m.awardStatus },
        );
      }
      return HttpResponse.json({ ...tracker(42, body.activityId, 1500, 4), leveledUp: true });
    }),
  );
  return { calls, release: () => open() };
}

function renderSystem() {
  signIn(ME, 'ADMIN');
  return renderRoutes([{ path: '/admin/system', element: <SystemToolsPage /> }], '/admin/system');
}

const messages = () => useToastStore.getState().toasts.map((t) => t.message);

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe('System tools — recompute ranks', () => {
  it('is disabled while it runs, then says how many users were ranked', async () => {
    const { calls, release } = mockSystem({ recompute: 'slow' });
    renderSystem();

    const card = (await screen.findByRole('region', { name: 'Recompute ranks' })) as HTMLElement;
    await userEvent.click(within(card).getByRole('button', { name: 'Recompute ranks' }));
    await waitFor(() => expect(calls.recompute).toBe(1));
    expect(within(card).getByRole('button', { name: 'Recompute ranks' })).toBeDisabled();
    expect(within(card).getByText('Recomputing…')).toBeInTheDocument();

    release();
    expect(await within(card).findByText(/Ranked/)).toHaveTextContent(/Ranked 240 users at /);
    expect(within(card).getByRole('button', { name: 'Recompute ranks' })).toBeEnabled();
  });

  it('says it failed, and offers to try again', async () => {
    mockSystem({ recompute: 500 });
    renderSystem();

    const card = (await screen.findByRole('region', { name: 'Recompute ranks' })) as HTMLElement;
    await userEvent.click(within(card).getByRole('button', { name: 'Recompute ranks' }));
    expect(await within(card).findByRole('alert')).toHaveTextContent(/Try again/);
  });
});

describe('System tools — level trackers', () => {
  it('lists every tracker, most XP first, with activity names', async () => {
    mockSystem();
    renderSystem();

    const card = (await screen.findByRole('region', { name: 'Level trackers' })) as HTMLElement;
    const rows = await within(card).findAllByRole('row');
    expect(rows).toHaveLength(4);
    expect(rows[1]).toHaveTextContent('User #142');
    expect(rows[1]).toHaveTextContent('Studying');
    expect(rows[1]).toHaveTextContent('1,500');
    expect(rows[2]).toHaveTextContent('User #42');
    expect(rows[3]).toHaveTextContent('User #7');
    expect(within(card).getByText('3 trackers')).toBeInTheDocument();
  });

  it('asks for one activity when it is chosen', async () => {
    const { calls } = mockSystem();
    renderSystem();

    const card = (await screen.findByRole('region', { name: 'Level trackers' })) as HTMLElement;
    await within(card).findAllByRole('row');
    await userEvent.selectOptions(within(card).getByLabelText('Activity'), 'Running');
    await waitFor(() => expect(calls.levels).toContain('activity:11'));
    await waitFor(() => expect(within(card).getAllByRole('row')).toHaveLength(3));
    expect(within(card).queryByText('User #142')).not.toBeInTheDocument();
  });

  it('finds a user by number', async () => {
    mockSystem();
    renderSystem();

    const card = (await screen.findByRole('region', { name: 'Level trackers' })) as HTMLElement;
    await within(card).findAllByRole('row');
    await userEvent.type(within(card).getByLabelText('Find a user'), '42');
    expect(within(card).getAllByRole('row')).toHaveLength(3); // header, 42 and 142
    expect(within(card).getByText('2 trackers')).toBeInTheDocument();

    await userEvent.clear(within(card).getByLabelText('Find a user'));
    await userEvent.type(within(card).getByLabelText('Find a user'), '999');
    expect(within(card).getByText('No trackers match.')).toBeInTheDocument();
  });

  it('shows 50 at a time', async () => {
    mockSystem({
      trackers: Array.from({ length: 120 }, (_, i) => tracker(1000 + i, 11, 5000 - i)),
    });
    renderSystem();

    const card = (await screen.findByRole('region', { name: 'Level trackers' })) as HTMLElement;
    await within(card).findAllByRole('row');
    expect(within(card).getAllByRole('row')).toHaveLength(51);
    await userEvent.click(within(card).getByRole('button', { name: 'Show more' }));
    expect(within(card).getAllByRole('row')).toHaveLength(101);
    await userEvent.click(within(card).getByRole('button', { name: 'Show more' }));
    expect(within(card).getAllByRole('row')).toHaveLength(121);
    expect(within(card).queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('says so when nobody has a level, and shows an error with a retry', async () => {
    mockSystem({ trackers: [] });
    renderSystem();
    expect(await screen.findByText('Nobody has earned a level yet.')).toBeInTheDocument();
  });

  it('shows an error with a retry when the trackers cannot load', async () => {
    mockSystem({ levelsStatus: 500 });
    renderSystem();
    expect(await screen.findByText("Couldn't load the level trackers")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});

describe('System tools — award XP manually', () => {
  async function fillAward(card: HTMLElement, user: string, activity: string, xp: string) {
    if (user) await userEvent.type(within(card).getByLabelText('User number'), user);
    if (activity) await userEvent.selectOptions(within(card).getByLabelText('Activity'), activity);
    if (xp) await userEvent.type(within(card).getByLabelText('XP'), xp);
  }
  const awardCard = async () =>
    (await screen.findByRole('region', { name: 'Award XP manually' })) as HTMLElement;

  it('repeats the user, activity and amount back before the final click', async () => {
    const { calls } = mockSystem();
    renderSystem();
    const card = await awardCard();
    await within(card).findByRole('option', { name: 'Running' });

    await fillAward(card, '42', 'Running', '500');
    await userEvent.click(within(card).getByRole('button', { name: 'Review award' }));

    const dialog = await within(card).findByRole('alertdialog', { name: 'Confirm the award' });
    expect(within(dialog).getByText('Award 500 XP in Running to User #42?')).toBeInTheDocument();
    expect(calls.awards).toEqual([]);

    await userEvent.click(within(dialog).getByRole('button', { name: 'Award XP' }));
    await waitFor(() =>
      expect(calls.awards).toEqual([{ targetUserId: 42, activityId: 11, xp: 500 }]),
    );
    expect(
      await within(card).findByText(/User #42 is now level 4 in Running with 1,500 XP/),
    ).toHaveTextContent('That crossed a level.');
    await waitFor(() => expect(messages()).toContain('Awarded 500 XP in Running'));
    expect(within(card).queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('awards yourself when the user is left blank, and says so', async () => {
    const { calls } = mockSystem();
    renderSystem();
    const card = await awardCard();
    await within(card).findByRole('option', { name: 'Studying' });

    await fillAward(card, '', 'Studying', '100');
    await userEvent.click(within(card).getByRole('button', { name: 'Review award' }));
    expect(
      await within(card).findByText('Award 100 XP in Studying to yourself (User #1)?'),
    ).toBeInTheDocument();
    await userEvent.click(within(card).getByRole('button', { name: 'Award XP' }));
    await waitFor(() => expect(calls.awards).toEqual([{ activityId: 12, xp: 100 }]));
  });

  it('checks the form first and does not ask for a confirm', async () => {
    mockSystem();
    renderSystem();
    const card = await awardCard();

    await userEvent.click(within(card).getByRole('button', { name: 'Review award' }));
    expect(await within(card).findByText('Choose an activity')).toBeInTheDocument();
    expect(within(card).getByText('Enter how much XP to award')).toBeInTheDocument();
    expect(within(card).queryByRole('alertdialog')).not.toBeInTheDocument();

    await userEvent.type(within(card).getByLabelText('User number'), 'abc');
    await userEvent.type(within(card).getByLabelText('XP'), '20000');
    await userEvent.click(within(card).getByRole('button', { name: 'Review award' }));
    expect(await within(card).findByText(/Enter a user number/)).toBeInTheDocument();
    expect(within(card).getByText('At most 10,000 XP per award')).toBeInTheDocument();
  });

  it('can be cancelled without awarding anything', async () => {
    const { calls } = mockSystem();
    renderSystem();
    const card = await awardCard();
    await within(card).findByRole('option', { name: 'Running' });

    await fillAward(card, '42', 'Running', '500');
    await userEvent.click(within(card).getByRole('button', { name: 'Review award' }));
    await userEvent.click(await within(card).findByRole('button', { name: 'Cancel' }));
    expect(within(card).queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(calls.awards).toEqual([]);
  });

  it('shows the server message inline when it rejects the award', async () => {
    mockSystem({ awardStatus: 400, awardDetail: 'xp exceeds the per-award cap of 10000' });
    renderSystem();
    const card = await awardCard();
    await within(card).findByRole('option', { name: 'Running' });

    await fillAward(card, '42', 'Running', '500');
    await userEvent.click(within(card).getByRole('button', { name: 'Review award' }));
    await userEvent.click(await within(card).findByRole('button', { name: 'Award XP' }));
    expect(
      await within(card).findByText('xp exceeds the per-award cap of 10000'),
    ).toBeInTheDocument();
    expect(within(card).getByRole('alertdialog')).toBeInTheDocument();
  });

  it('shows an error toast for any other failure', async () => {
    mockSystem({ awardStatus: 500 });
    renderSystem();
    const card = await awardCard();
    await within(card).findByRole('option', { name: 'Running' });

    await fillAward(card, '42', 'Running', '500');
    await userEvent.click(within(card).getByRole('button', { name: 'Review award' }));
    await userEvent.click(await within(card).findByRole('button', { name: 'Award XP' }));
    await waitFor(() => expect(messages()).toContain("Couldn't award the XP. Try again."));
  });
});
