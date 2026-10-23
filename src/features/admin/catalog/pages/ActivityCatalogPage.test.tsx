import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { useToastStore } from '@/components/ui/toastStore';
import type { CatalogActivity } from '@/features/activities/types';
import { renderRoutes, signIn } from '@/test/helpers';
import { server } from '@/test/server';
import ActivityCatalogPage from './ActivityCatalogPage';

const act = (over: Partial<CatalogActivity> & { id: number; name: string }): CatalogActivity => ({
  category: 'STUDY',
  xpMultiplier: 1.5,
  active: true,
  description: null,
  createdAt: '2026-10-01T00:00:00',
  ...over,
});

const seed: CatalogActivity[] = [
  act({ id: 1, name: 'Running', category: 'HEALTH', xpMultiplier: 1.3 }),
  act({ id: 2, name: 'Deep work', category: 'WORK', xpMultiplier: 1.8, description: 'Focus' }),
  act({ id: 3, name: 'Archery', category: 'HEALTH', xpMultiplier: 1.3, active: false }),
  act({ id: 4, name: 'Algebra', category: 'STUDY' }),
];

type Mocks = {
  rows?: CatalogActivity[];
  listStatus?: number;
  /** Status for create/patch/delete instead of success. */
  writeStatus?: number;
  writeBody?: object;
  /** What delete answers. */
  removeResult?: 'REMOVED' | 'DEACTIVATED';
};

function mockCatalog(m: Mocks = {}) {
  const calls = {
    list: [] as string[],
    created: [] as object[],
    patched: [] as { id: string; body: object }[],
    deleted: [] as string[],
  };
  server.use(
    http.get('*/api/activity', ({ request }) => {
      calls.list.push(new URL(request.url).searchParams.get('includeInactive') ?? '');
      if (m.listStatus) return HttpResponse.json({ detail: 'Down' }, { status: m.listStatus });
      return HttpResponse.json(m.rows ?? seed);
    }),
    http.post('*/api/activity', async ({ request }) => {
      const body = (await request.json()) as object;
      calls.created.push(body);
      if (m.writeStatus) {
        return HttpResponse.json(m.writeBody ?? { detail: 'No' }, { status: m.writeStatus });
      }
      return HttpResponse.json({ ...act({ id: 99, name: 'New' }), ...body });
    }),
    http.patch('*/api/activity/:id', async ({ params, request }) => {
      calls.patched.push({ id: String(params.id), body: (await request.json()) as object });
      if (m.writeStatus) {
        return HttpResponse.json(m.writeBody ?? { detail: 'No' }, { status: m.writeStatus });
      }
      return HttpResponse.json(seed[0]);
    }),
    http.delete('*/api/activity/:id', ({ params }) => {
      calls.deleted.push(String(params.id));
      if (m.writeStatus) return HttpResponse.json({ detail: 'No' }, { status: m.writeStatus });
      return HttpResponse.json({
        id: Number(params.id),
        name: 'X',
        result: m.removeResult ?? 'REMOVED',
      });
    }),
  );
  return calls;
}

function renderCatalog() {
  signIn(1, 'ADMIN');
  return renderRoutes(
    [{ path: '/admin/catalog', element: <ActivityCatalogPage /> }],
    '/admin/catalog',
  );
}

const messages = () => useToastStore.getState().toasts.map((t) => t.message);

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe('Catalog — the table', () => {
  it('asks for inactive ones too, sorts by category then name, and hides inactive until shown', async () => {
    const calls = mockCatalog();
    renderCatalog();

    const rows = await screen.findAllByRole('row');
    expect(calls.list[0]).toBe('true');
    // Header + Study (Algebra), Work (Deep work), Health (Running); Archery is inactive.
    expect(within(rows[1] as HTMLElement).getByText('Algebra')).toBeInTheDocument();
    expect(within(rows[2] as HTMLElement).getByText('Deep work')).toBeInTheDocument();
    expect(within(rows[3] as HTMLElement).getByText('Running')).toBeInTheDocument();
    expect(screen.queryByText('Archery')).not.toBeInTheDocument();
    expect(screen.getByText('3 activities, 1 inactive hidden.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Show inactive' }));
    const archery = screen.getByText('Archery').closest('tr') as HTMLElement;
    expect(within(archery).getByText('Inactive')).toBeInTheDocument();
    expect(within(archery).getByRole('switch', { name: 'Archery is active' })).not.toBeChecked();
  });

  it('shows whether the multiplier is the category default or an override', async () => {
    mockCatalog();
    renderCatalog();

    const deep = (await screen.findByText('Deep work')).closest('tr') as HTMLElement;
    expect(within(deep).getByText('×1.8')).toBeInTheDocument();
    expect(within(deep).getByText('override')).toBeInTheDocument();
    const running = screen.getByText('Running').closest('tr') as HTMLElement;
    expect(within(running).getByText('×1.3')).toBeInTheDocument();
    expect(within(running).getByText('category default')).toBeInTheDocument();
  });

  it('shows an error with a retry, and an empty state', async () => {
    mockCatalog({ listStatus: 500 });
    renderCatalog();
    expect(await screen.findByText("Couldn't load the catalog")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('invites a first activity when the catalog is empty', async () => {
    mockCatalog({ rows: [] });
    renderCatalog();
    expect(await screen.findByText('No activities yet')).toBeInTheDocument();
  });
});

describe('Catalog — creating', () => {
  it('creates an activity with an override and a description', async () => {
    const calls = mockCatalog();
    renderCatalog();

    await userEvent.click(await screen.findByRole('button', { name: 'New activity' }));
    const panel = await screen.findByRole('dialog', { name: 'New activity' });
    await userEvent.type(within(panel).getByLabelText('Name'), '  Reading list ');
    await userEvent.selectOptions(within(panel).getByLabelText('Category'), 'WORK');
    await userEvent.type(within(panel).getByLabelText('XP multiplier'), '1.8');
    await userEvent.type(within(panel).getByLabelText('Description'), 'Books');
    await userEvent.click(within(panel).getByRole('button', { name: 'Create activity' }));

    await waitFor(() => expect(calls.created).toHaveLength(1));
    expect(calls.created[0]).toEqual({
      name: 'Reading list',
      category: 'WORK',
      xpMultiplier: 1.8,
      description: 'Books',
      active: true,
    });
    await waitFor(() => expect(messages()).toContain('Created Reading list'));
  });

  it('shows the category default beside the multiplier and leaves it out when blank', async () => {
    const calls = mockCatalog();
    renderCatalog();

    await userEvent.click(await screen.findByRole('button', { name: 'New activity' }));
    const panel = await screen.findByRole('dialog', { name: 'New activity' });
    expect(within(panel).getByText(/Study defaults to ×1.5/)).toBeInTheDocument();
    await userEvent.selectOptions(within(panel).getByLabelText('Category'), 'GAMING');
    expect(within(panel).getByText(/Gaming defaults to ×0.5/)).toBeInTheDocument();

    await userEvent.type(within(panel).getByLabelText('Name'), 'Chess');
    await userEvent.click(within(panel).getByRole('button', { name: 'Create activity' }));
    await waitFor(() => expect(calls.created).toHaveLength(1));
    expect(calls.created[0]).toEqual({ name: 'Chess', category: 'GAMING', active: true });
  });

  it('warns about a duplicate name as you type and will not submit it', async () => {
    const calls = mockCatalog();
    renderCatalog();

    await userEvent.click(await screen.findByRole('button', { name: 'New activity' }));
    const panel = await screen.findByRole('dialog', { name: 'New activity' });
    await userEvent.type(within(panel).getByLabelText('Name'), ' running');
    expect(
      within(panel).getByText('An activity with this name already exists'),
    ).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Create activity' })).toBeDisabled();
    expect(calls.created).toEqual([]);
  });

  it('puts a server 409 on the name field and a 400 on its field', async () => {
    mockCatalog({ writeStatus: 409 });
    renderCatalog();

    await userEvent.click(await screen.findByRole('button', { name: 'New activity' }));
    const panel = await screen.findByRole('dialog', { name: 'New activity' });
    await userEvent.type(within(panel).getByLabelText('Name'), 'Reading');
    await userEvent.click(within(panel).getByRole('button', { name: 'Create activity' }));
    expect(
      await within(panel).findByText('An activity with this name already exists'),
    ).toBeInTheDocument();
  });

  it('shows a 400 on the field it names', async () => {
    mockCatalog({
      writeStatus: 400,
      writeBody: { status: 400, detail: 'bad', errors: { xpMultiplier: 'must be at least 0' } },
    });
    renderCatalog();

    await userEvent.click(await screen.findByRole('button', { name: 'New activity' }));
    const panel = await screen.findByRole('dialog', { name: 'New activity' });
    await userEvent.type(within(panel).getByLabelText('Name'), 'Reading');
    await userEvent.click(within(panel).getByRole('button', { name: 'Create activity' }));
    expect(await within(panel).findByText('must be at least 0')).toBeInTheDocument();
  });

  it('checks the form before it asks the server', async () => {
    const calls = mockCatalog();
    renderCatalog();

    await userEvent.click(await screen.findByRole('button', { name: 'New activity' }));
    const panel = await screen.findByRole('dialog', { name: 'New activity' });
    await userEvent.click(within(panel).getByRole('button', { name: 'Create activity' }));
    expect(await within(panel).findByText('Name is required')).toBeInTheDocument();
    await userEvent.type(within(panel).getByLabelText('Name'), 'Reading');
    await userEvent.type(within(panel).getByLabelText('XP multiplier'), '-2');
    await userEvent.click(within(panel).getByRole('button', { name: 'Create activity' }));
    expect(await within(panel).findByText(/Enter a number, or leave it blank/)).toBeInTheDocument();
    expect(calls.created).toEqual([]);
  });
});

describe('Catalog — editing, switching and deleting', () => {
  it('sends only what changed when editing', async () => {
    const calls = mockCatalog();
    renderCatalog();

    await userEvent.click(await screen.findByRole('button', { name: 'Edit Deep work' }));
    const panel = await screen.findByRole('dialog', { name: 'Edit Deep work' });
    expect(within(panel).getByRole('button', { name: 'Save changes' })).toBeDisabled();
    const name = within(panel).getByLabelText('Name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Focus time');
    await userEvent.click(within(panel).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(calls.patched).toHaveLength(1));
    expect(calls.patched[0]).toEqual({ id: '2', body: { name: 'Focus time' } });
    await waitFor(() => expect(messages()).toContain('Saved Focus time'));
  });

  it('clears an override by blanking the multiplier', async () => {
    const calls = mockCatalog();
    renderCatalog();

    await userEvent.click(await screen.findByRole('button', { name: 'Edit Deep work' }));
    const panel = await screen.findByRole('dialog', { name: 'Edit Deep work' });
    await userEvent.clear(within(panel).getByLabelText('XP multiplier'));
    await userEvent.click(within(panel).getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(calls.patched).toHaveLength(1));
    expect(calls.patched[0]?.body).toEqual({ xpMultiplier: 0 });
  });

  it('deactivates and reactivates from the switch', async () => {
    const calls = mockCatalog();
    renderCatalog();

    await userEvent.click(await screen.findByRole('switch', { name: 'Running is active' }));
    await waitFor(() => expect(calls.patched).toEqual([{ id: '1', body: { active: false } }]));
    await waitFor(() => expect(messages()).toContain('Deactivated Running'));

    await userEvent.click(screen.getByRole('checkbox', { name: 'Show inactive' }));
    await userEvent.click(screen.getByRole('switch', { name: 'Archery is active' }));
    await waitFor(() => expect(calls.patched.at(-1)).toEqual({ id: '3', body: { active: true } }));
    await waitFor(() => expect(messages()).toContain('Reactivated Archery'));
  });

  it('asks before deleting, then says whether it was removed', async () => {
    const calls = mockCatalog({ removeResult: 'REMOVED' });
    renderCatalog();

    await userEvent.click(await screen.findByRole('button', { name: 'Delete Algebra' }));
    expect(
      screen.getByText(/Delete Algebra\? If it has logs it is only deactivated/),
    ).toBeInTheDocument();
    expect(calls.deleted).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(calls.deleted).toEqual([]);

    await userEvent.click(screen.getByRole('button', { name: 'Delete Algebra' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(calls.deleted).toEqual(['4']));
    await waitFor(() => expect(messages()).toContain('Removed Algebra'));
  });

  it('says so when a delete only deactivated an activity that has logs', async () => {
    mockCatalog({ removeResult: 'DEACTIVATED' });
    renderCatalog();

    await userEvent.click(await screen.findByRole('button', { name: 'Delete Running' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(messages()).toContain('Deactivated Running. It has logs, so it stays in History.'),
    );
  });

  it('shows an error toast when a change fails', async () => {
    mockCatalog({ writeStatus: 500 });
    renderCatalog();

    await userEvent.click(await screen.findByRole('switch', { name: 'Running is active' }));
    await waitFor(() => expect(messages()).toContain("Couldn't change that activity. Try again."));
  });
});
