import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNumber } from '@/lib/utils/format';
import { useAdminCatalog } from '../../catalog/api';
import { useAllLevels } from '../api';
import { byTotalXp, searchTrackers } from '../system';

const PAGE = 50;

/** Every user's level in every activity: read-only, searchable by user number, filtered by activity. */
export function TrackersCard() {
  const catalog = useAdminCatalog();
  const [activityId, setActivityId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE);
  const levels = useAllLevels(activityId);

  const names = useMemo(
    () => new Map((catalog.data ?? []).map((a) => [a.id, a.name])),
    [catalog.data],
  );
  const rows = useMemo(
    () => searchTrackers(byTotalXp(levels.data ?? []), search),
    [levels.data, search],
  );

  return (
    <Card className="flex flex-col gap-4" role="region" aria-labelledby="trackers-title">
      <div>
        <h2 id="trackers-title" className="font-display text-3xl leading-none font-extrabold">
          Level trackers
        </h2>
        <p className="mt-1 max-w-prose text-soft">
          Every user&apos;s level in every activity, most XP first. Read-only.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-soft">Activity</span>
          <select
            value={activityId ?? ''}
            onChange={(e) => {
              setActivityId(e.target.value ? Number(e.target.value) : null);
              setShown(PAGE);
            }}
            className="min-h-11 rounded-xl border border-line-strong bg-surface-2 px-3.5"
          >
            <option value="">All activities</option>
            {(catalog.data ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-soft">Find a user</span>
          <input
            type="search"
            inputMode="numeric"
            placeholder="User number, like 4012"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShown(PAGE);
            }}
            className="min-h-11 w-56 rounded-xl border border-line-strong bg-surface-2 px-3.5"
          />
        </label>
        {levels.isSuccess && (
          <p className="pb-3 text-sm text-muted" aria-live="polite">
            {formatNumber(rows.length)} {rows.length === 1 ? 'tracker' : 'trackers'}
          </p>
        )}
      </div>

      {levels.isPending ? (
        <div role="status" aria-label="Loading the level trackers" className="flex flex-col gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : levels.isError ? (
        <ErrorPanel
          error={levels.error}
          title="Couldn't load the level trackers"
          onRetry={() => void levels.refetch()}
        />
      ) : rows.length === 0 ? (
        <p className="text-soft">
          {search.trim() || activityId !== null
            ? 'No trackers match.'
            : 'Nobody has earned a level yet.'}
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[34rem] border-collapse text-left text-[15px]">
              <caption className="sr-only">Level trackers</caption>
              <thead>
                <tr className="border-b border-line text-sm text-muted">
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    User
                  </th>
                  <th scope="col" className="px-2 py-2.5 font-medium">
                    Activity
                  </th>
                  <th scope="col" className="px-2 py-2.5 text-right font-medium">
                    Level
                  </th>
                  <th scope="col" className="px-2 py-2.5 text-right font-medium">
                    Total XP
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">
                    In this level
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, shown).map((r) => (
                  <tr
                    key={`${r.userId}-${r.activityId}`}
                    className="border-b border-line last:border-0"
                  >
                    <td className="px-4 py-2 whitespace-nowrap">User #{r.userId}</td>
                    <td className="px-2 py-2">
                      {names.get(r.activityId) ?? `Activity #${r.activityId}`}
                    </td>
                    <td className="px-2 py-2 text-right font-mono">{r.level}</td>
                    <td className="px-2 py-2 text-right font-mono">
                      {formatNumber(Math.round(r.totalXp))}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-muted">
                      {formatNumber(Math.round(r.currentLevelXp))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > shown && (
            <Button
              variant="secondary"
              className="self-start"
              onClick={() => setShown((n) => n + PAGE)}
            >
              Show more
            </Button>
          )}
        </>
      )}
    </Card>
  );
}
