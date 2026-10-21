import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { LeaderboardTable } from '@/components/ui/LeaderboardTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCatalog } from '@/features/activities/api';
import { useUserId } from '@/lib/auth/useUserId';
import { useGlobalBoard, useMyGlobalRank, useMyRank } from '../api';
import { useOwnRowVisible } from '../useOwnRowVisible';
import { PinnedYou } from './PinnedYou';

type GlobalTabProps = {
  /** The activity the board is filtered to, or null for everything. */
  activityId: number | null;
  onActivityChange: (activityId: number | null) => void;
};

/** The overall board, or one activity's ("Top in Running"). */
export function GlobalTab({ activityId, onActivityChange }: GlobalTabProps) {
  const userId = useUserId();
  const catalog = useCatalog();
  const board = useGlobalBoard(activityId);
  const rank = useMyRank();
  const myRank = useMyGlobalRank();

  const [ownRow, setOwnRow] = useState<HTMLTableRowElement | null>(null);
  const ownVisible = useOwnRowVisible(ownRow);

  const activities = (catalog.data ?? []).filter((a) => a.active);
  const chosen = activities.find((a) => a.id === activityId);
  const rows = (board.data?.pages ?? []).flat();

  // The backend has no "my rank" for a single activity, so only the overall board can pin you.
  const pinned =
    activityId === null && myRank.data !== undefined && rank.data
      ? { position: myRank.data, xp: rank.data.totalXp }
      : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex max-w-xs flex-col gap-1.5">
        <label htmlFor="board-activity" className="text-sm font-medium text-soft">
          Activity
        </label>
        <select
          id="board-activity"
          value={activityId ?? ''}
          onChange={(e) => onActivityChange(e.target.value === '' ? null : Number(e.target.value))}
          className="min-h-11 rounded-xl border border-line-strong bg-surface-2 px-3.5 text-text"
        >
          <option value="">All activities</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <h2 className="font-display text-4xl leading-none font-extrabold">
        {chosen ? `Top in ${chosen.name}` : 'Top climbers'}
      </h2>

      {board.isPending ? (
        <div role="status" aria-label="Loading the board" className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : board.isError ? (
        <ErrorPanel
          error={board.error}
          title="Couldn't load the board"
          onRetry={() => void board.refetch()}
        />
      ) : rows.length === 0 ? (
        <p className="text-soft">
          {chosen ? `Nobody has logged ${chosen.name} yet.` : 'Nobody is on the board yet.'}
        </p>
      ) : (
        <>
          <LeaderboardTable
            rows={rows.map((r) => ({
              position: r.rank,
              userId: r.userId,
              totalXp: r.totalXp,
              name: r.displayName,
            }))}
            currentUserId={userId}
            caption={chosen ? `Top in ${chosen.name}` : 'Top climbers overall'}
            ownRowRef={setOwnRow}
          />
          {board.hasNextPage && (
            <Button
              variant="secondary"
              size="lg"
              className="self-start rounded-full"
              loading={board.isFetchingNextPage}
              onClick={() => void board.fetchNextPage()}
            >
              Show more
            </Button>
          )}
        </>
      )}

      {pinned && !ownVisible && <PinnedYou position={pinned.position} xp={pinned.xp} />}
    </div>
  );
}
