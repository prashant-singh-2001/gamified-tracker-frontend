import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { LeaderboardTable } from '@/components/ui/LeaderboardTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { getTierInfo, RANK_TIERS, type RankTier } from '@/lib/api/types';
import { useUserId } from '@/lib/auth/useUserId';
import { cn } from '@/lib/utils/cn';
import { useMyRank, useMyTierBoard, useTierBoardPages } from '../api';
import { useOwnRowVisible } from '../useOwnRowVisible';
import { PinnedYou } from './PinnedYou';

/** Tier chips (Basecamp to Summit, wrapping) above one tier's ranked list. */
export function TierBoardTab({ tier }: { tier: RankTier }) {
  const userId = useUserId();
  const rank = useMyRank();
  const board = useTierBoardPages(tier);
  const info = getTierInfo(tier);
  const mine = rank.data ?? null;
  const isMine = mine?.tier === tier;

  // The user's row from the tier's first 100, for pinning when they are further down the list.
  const own = useMyTierBoard(isMine);
  const pinned = own.data?.find((m) => m.userId === userId);

  const [ownRow, setOwnRow] = useState<HTMLTableRowElement | null>(null);
  const ownVisible = useOwnRowVisible(ownRow);

  const rows = (board.data?.pages ?? []).flat();

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Choose a tier" className="flex flex-wrap gap-2">
        {RANK_TIERS.map((t) => (
          <Link
            key={t.id}
            to={`/app/ranks/${t.id}`}
            replace
            aria-current={t.id === tier ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-medium no-underline transition',
              t.id === tier
                ? 'border-text bg-text text-bg'
                : 'border-line-strong text-soft hover:text-text',
            )}
          >
            {t.label}
            {mine?.tier === t.id && (
              <>
                <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
                <span className="sr-only">(your tier)</span>
              </>
            )}
          </Link>
        ))}
      </nav>

      <h2 className="font-display text-4xl leading-none font-extrabold">
        {info.label} <span className="text-2xl font-bold text-muted">{info.band}</span>
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
          title="Couldn't load this tier"
          onRetry={() => void board.refetch()}
        />
      ) : rows.length === 0 ? (
        <p className="text-soft">Nobody in {info.label} yet.</p>
      ) : (
        <>
          <LeaderboardTable
            rows={rows.map((m) => ({
              position: m.withinRankPosition,
              userId: m.userId,
              totalXp: m.totalXp,
              level: m.overallLevel,
              name: m.displayName,
            }))}
            currentUserId={userId}
            caption={`${info.label} tier`}
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

      {pinned && !ownVisible && (
        <PinnedYou
          position={pinned.withinRankPosition}
          xp={pinned.totalXp}
          level={pinned.overallLevel}
        />
      )}
    </div>
  );
}
