import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/toastStore';
import { useLadder } from '@/features/activities/api';
import type { Threshold } from '@/features/activities/types';
import { toApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/format';
import { AdminPageHeader } from '../../components/AdminPageHeader';
import { sortCatalog } from '../../catalog/catalog';
import { useAdminCatalog } from '../../catalog/api';
import {
  useAllThresholds,
  useDeleteThreshold,
  useReadThreshold,
  useSaveThreshold,
  useUpdateThreshold,
} from '../api';
import { checkLevel, explicitRows, withLevel, withSteps } from '../curve';
import { CurveChart } from '../components/CurveChart';
import { LadderTable } from '../components/LadderTable';

/** How many levels the default curve is drawn to. */
const DEFAULT_LEVELS = 12;

type Confirm =
  | { kind: 'add'; level: number; xp: number }
  | { kind: 'edit'; level: number; xp: number; changedTo?: number }
  | { kind: 'delete'; level: number };

/**
 * How much XP each level costs, per activity. Every change moves everyone's progress the next time
 * they earn XP, so each write is previewed on the curve and confirmed first.
 */
export default function LevelingRulesPage() {
  const catalog = useAdminCatalog();
  const all = useAllThresholds();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const activities = useMemo(() => sortCatalog(catalog.data ?? []), [catalog.data]);
  const chosen = Number(params.get('activity'));
  const activityId = activities.find((a) => a.id === chosen)?.id ?? activities[0]?.id ?? 0;
  const activity = activities.find((a) => a.id === activityId);

  const defaultLadder = useLadder(activityId, DEFAULT_LEVELS);
  const own = useMemo(() => explicitRows(all.data ?? [], activityId), [all.data, activityId]);
  const usingDefault = own.length === 0;
  const shown: Threshold[] = usingDefault ? (defaultLadder.data ?? []) : own;

  const save = useSaveThreshold();
  const update = useUpdateThreshold();
  const remove = useDeleteThreshold();
  const read = useReadThreshold();
  const busy = save.isPending || update.isPending || remove.isPending || read.isPending;

  const [level, setLevel] = useState('');
  const [xp, setXp] = useState('');
  const [editing, setEditing] = useState<{ level: number; xp: string } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const typedLevel = level.trim() === '' ? NaN : Number(level);
  const typedXp = xp.trim() === '' ? NaN : Number(xp);
  const typing = level.trim() !== '' && xp.trim() !== '';
  const addError = typing ? checkLevel(own, typedLevel, typedXp) : null;
  const preview =
    typing && !addError
      ? usingDefault
        ? [{ activityId, level: typedLevel, xpRequired: typedXp }]
        : withLevel(own, typedLevel, typedXp)
      : undefined;
  const replacing = own.find((r) => r.level === typedLevel);

  function choose(id: number) {
    setConfirm(null);
    setEditing(null);
    void navigate(`/admin/leveling?activity=${id}`, { replace: true });
  }

  /**
   * An edit re-reads the level before it asks to confirm: the ladder on screen may be old, and
   * the admin should see if someone else already changed this level (or removed it).
   */
  function requestEdit() {
    if (!editing) return;
    const value = Number(editing.xp);
    const problem =
      editing.xp.trim() === '' ? 'Enter the XP required' : checkLevel(own, editing.level, value);
    setEditError(problem);
    if (problem) return;
    const { level: editLevel } = editing;
    setServerError(null);
    read.mutate(
      { activityId, level: editLevel },
      {
        onSuccess: (fresh) => {
          const shown = own.find((r) => r.level === editLevel)?.xpRequired;
          const changed = shown !== undefined && fresh.xpRequired !== shown;
          setConfirm({
            kind: 'edit',
            level: editLevel,
            xp: value,
            changedTo: changed ? fresh.xpRequired : undefined,
          });
          if (changed) void all.refetch();
        },
        onError: (err) => {
          if (toApiError(err).status === 404) {
            setEditing(null);
            setEditError(null);
            void all.refetch();
            toast.info(`Level ${editLevel} no longer exists. The ladder has been refreshed.`);
          } else {
            toast.error("Couldn't check that level. Try again.");
          }
        },
      },
    );
  }

  function run(c: Confirm) {
    const done = (message: string) => {
      toast.success(message);
      setConfirm(null);
      setEditing(null);
      setServerError(null);
      if (c.kind === 'add') {
        setLevel('');
        setXp('');
      }
    };
    const failed = (err: unknown) => {
      const api = toApiError(err);
      // A rule the client could not see (someone else changed the ladder) reads as the server says it.
      if (api.status === 409 || api.status === 400) setServerError(api.message);
      else toast.error("Couldn't save that change. Try again.");
    };
    if (c.kind === 'delete') {
      remove.mutate(
        { activityId, level: c.level },
        { onSuccess: () => done(`Removed level ${c.level}`), onError: failed },
      );
    } else if (c.kind === 'edit') {
      update.mutate(
        { activityId, level: c.level, xpRequired: c.xp },
        {
          onSuccess: () => done(`Level ${c.level} now needs ${formatNumber(c.xp)} XP`),
          onError: failed,
        },
      );
    } else {
      save.mutate(
        { activityId, level: c.level, xpRequired: c.xp },
        { onSuccess: () => done(`Added level ${c.level}`), onError: failed },
      );
    }
  }

  const name = activity?.name ?? 'this activity';

  return (
    <div>
      <AdminPageHeader
        title="Leveling rules"
        description="How much XP each level costs, per activity. Changes reach everyone the next time they earn XP."
      />

      {catalog.isPending || all.isPending ? (
        <div
          role="status"
          aria-label="Loading the leveling rules"
          className="grid gap-4 lg:grid-cols-[16rem_1fr]"
        >
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
      ) : catalog.isError || all.isError ? (
        <ErrorPanel
          error={catalog.error ?? all.error}
          title="Couldn't load the leveling rules"
          onRetry={() => {
            void catalog.refetch();
            void all.refetch();
          }}
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[16rem_1fr]">
          <div>
            <label className="flex flex-col gap-1.5 lg:hidden">
              <span className="text-sm font-medium text-soft">Activity</span>
              <select
                value={activityId}
                onChange={(e) => choose(Number(e.target.value))}
                className="min-h-11 rounded-xl border border-line-strong bg-surface px-3.5"
              >
                {activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
            <nav aria-label="Activities" className="hidden flex-col gap-1 lg:flex">
              {activities.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-current={a.id === activityId ? 'true' : undefined}
                  onClick={() => choose(a.id)}
                  className={cn(
                    'flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-left text-[15px]',
                    a.id === activityId ? 'bg-surface-2 font-bold' : 'text-soft hover:text-text',
                  )}
                >
                  {a.name}
                  {!a.active && <span className="text-xs font-normal text-muted">Inactive</span>}
                </button>
              ))}
            </nav>
          </div>

          <section aria-label={`${name} levels`} className="flex min-w-0 flex-col gap-5">
            <div>
              <h2 className="font-display text-3xl leading-none font-extrabold">{name}</h2>
              <p className="mt-1 text-soft">
                {usingDefault
                  ? 'Using the default curve. Adding a level replaces it with only the levels you add.'
                  : `A custom curve of ${own.length} ${own.length === 1 ? 'level' : 'levels'}.`}
              </p>
            </div>

            <Card className="p-4">
              {defaultLadder.isPending && usingDefault ? (
                <Skeleton className="h-52" />
              ) : (
                <CurveChart rows={shown} preview={preview} dashed={usingDefault} />
              )}
            </Card>

            {confirm && (
              <Card
                role="alertdialog"
                aria-label="Confirm the change"
                className="flex flex-col gap-3 border-text"
              >
                <p className="font-medium">
                  This changes level progress for everyone who logs {name}, the next time they earn
                  XP. Continue?
                </p>
                <ul className="list-disc pl-5 text-soft">
                  {confirm.kind === 'add' && usingDefault && (
                    <li>
                      {name} uses the default curve. After this it uses only the levels you add.
                    </li>
                  )}
                  {confirm.kind === 'add' && replacing && (
                    <li>
                      Level {confirm.level} already needs {formatNumber(replacing.xpRequired)} XP;
                      this replaces it.
                    </li>
                  )}
                  {confirm.kind === 'edit' && confirm.changedTo !== undefined && (
                    <li>
                      Level {confirm.level} now needs {formatNumber(confirm.changedTo)} XP (it
                      changed since you opened it); this replaces that.
                    </li>
                  )}
                  {confirm.kind === 'delete' && own.length === 1 && (
                    <li>This is the last level, so {name} goes back to the default curve.</li>
                  )}
                  <li>
                    {confirm.kind === 'delete'
                      ? `Remove level ${confirm.level}.`
                      : `Level ${confirm.level} needs ${formatNumber(confirm.xp)} XP.`}
                  </li>
                </ul>
                {serverError && (
                  <p role="alert" className="text-sm text-danger">
                    {serverError}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button loading={busy} onClick={() => run(confirm)}>
                    Continue
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setConfirm(null);
                      setServerError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}

            {defaultLadder.isError && usingDefault ? (
              <ErrorPanel
                error={defaultLadder.error}
                title="Couldn't load the ladder"
                onRetry={() => void defaultLadder.refetch()}
              />
            ) : (
              <LadderTable
                rows={withSteps(shown)}
                editable={!usingDefault}
                editing={editing}
                onEditing={(next) => {
                  setEditing(next);
                  setEditError(null);
                }}
                onSaveEdit={requestEdit}
                onDelete={(l) => {
                  setServerError(null);
                  setConfirm({ kind: 'delete', level: l });
                }}
                error={editError}
              />
            )}

            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (!typing || addError) return;
                setServerError(null);
                setConfirm({ kind: 'add', level: typedLevel, xp: typedXp });
              }}
              className="flex flex-wrap items-start gap-3"
            >
              <div className="w-32">
                <Input
                  label="Level"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                />
              </div>
              <div className="w-44">
                <Input
                  label="XP required"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={xp}
                  onChange={(e) => setXp(e.target.value)}
                />
              </div>
              <Button type="submit" className="mt-[26px]" disabled={!typing || addError !== null}>
                Add level
              </Button>
              {addError && (
                <p role="alert" className="basis-full text-sm text-danger">
                  {addError}
                </p>
              )}
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
