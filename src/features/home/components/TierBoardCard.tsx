import { useState } from 'react';
import { Link } from 'react-router';
import { Card } from '@/components/ui/Card';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { LeaderboardTable } from '@/components/ui/LeaderboardTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMyRank, useTierBoard } from '@/features/ranks/api';
import { getTierInfo, RANK_TIERS, type RankTier } from '@/lib/api/types';
import { useUserId } from '@/lib/auth/useUserId';
import { cn } from '@/lib/utils/cn';

const TOP = 5;

/** Top five of any tier. Defaults to the user's own tier, so it differs from the neighbours card. */
export function TierBoardCard() {
  const userId = useUserId();
  const rank = useMyRank();
  const [picked, setPicked] = useState<RankTier | null>(null);
  // Unranked users start at the bottom of the mountain, where everyone begins.
  const tier = picked ?? rank.data?.tier ?? 'BASECAMP';
  const board = useTierBoard(tier, TOP);
  const info = getTierInfo(tier);

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-extrabold">Top of the tiers</h2>

      <div
        role="group"
        aria-label="Choose a tier"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      >
        {RANK_TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={t.id === tier}
            onClick={() => setPicked(t.id)}
            className={cn(
              'min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition',
              t.id === tier
                ? 'border-rank bg-rank/15 text-rank'
                : 'border-line-strong text-muted hover:text-text',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {board.isPending ? (
        <div role="status" aria-label="Loading leaderboard" className="flex flex-col gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      ) : board.isError ? (
        <ErrorPanel
          error={board.error}
          title="Couldn't load this tier"
          onRetry={() => void board.refetch()}
        />
      ) : board.data.length === 0 ? (
        <p className="py-4 text-center text-soft">No one is in {info.label} yet.</p>
      ) : (
        <LeaderboardTable
          rows={board.data.map((m) => ({
            position: m.withinRankPosition,
            userId: m.userId,
            totalXp: m.totalXp,
            level: m.overallLevel,
          }))}
          currentUserId={userId}
          caption={`Top ${TOP} in ${info.label}`}
        />
      )}

      <Link
        to={`/app/ranks/${tier}`}
        className="inline-flex min-h-11 items-center self-start text-[15px] font-medium text-accent no-underline hover:underline"
      >
        See the full {info.label} board
      </Link>
    </Card>
  );
}
