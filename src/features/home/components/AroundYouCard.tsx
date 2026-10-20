import { Mountain } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { LeaderboardTable, type LeaderboardRow } from '@/components/ui/LeaderboardTable';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useMyRank, useMyTierBoard } from '@/features/ranks/api';
import { neighboursOf } from '@/features/ranks/neighbours';
import { getTierInfo } from '@/lib/api/types';
import { useUserId } from '@/lib/auth/useUserId';

const NEIGHBOURS = 5;

/** The climbers just above and below you in your tier. */
export function AroundYouCard() {
  const rank = useMyRank();
  const userId = useUserId();
  const board = useMyTierBoard(rank.isSuccess && rank.data !== null);

  if (rank.isPending) return <CardSkeleton label="Loading your neighbours" />;
  if (rank.isError) {
    return (
      <ErrorPanel
        error={rank.error}
        title="Couldn't load your neighbours"
        onRetry={() => void rank.refetch()}
      />
    );
  }
  if (rank.data === null) {
    return (
      <Card className="flex flex-col gap-3">
        <h2 className="font-display text-3xl leading-none font-extrabold">Around you</h2>
        <p className="text-soft">Once you are ranked, the climbers next to you show up here.</p>
      </Card>
    );
  }

  const card = rank.data;
  const tier = getTierInfo(card.tier);

  let rows: LeaderboardRow[] = [];
  let alone = false;
  if (board.data && userId !== undefined) {
    const near = neighboursOf(board.data, userId, NEIGHBOURS);
    if (near) {
      alone = board.data.length === 1;
      rows = near.map((m) => ({
        position: m.withinRankPosition,
        userId: m.userId,
        totalXp: m.totalXp,
        level: m.overallLevel,
        name: m.displayName,
      }));
    } else {
      // Too far down a big tier to be in the loaded page: show the top, then pin the user.
      rows = [
        ...board.data.slice(0, NEIGHBOURS).map((m) => ({
          position: m.withinRankPosition,
          userId: m.userId,
          totalXp: m.totalXp,
          level: m.overallLevel,
          name: m.displayName,
        })),
        { position: card.position, userId, totalXp: card.totalXp, level: card.overallLevel },
      ];
    }
  }

  return (
    <Card className="flex flex-col gap-5">
      <h2 className="font-display text-3xl leading-none font-extrabold">Around you</h2>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        {board.isPending ? (
          <CardSkeleton label="Loading your neighbours" className="flex-1" />
        ) : board.isError ? (
          <ErrorPanel
            error={board.error}
            title="Couldn't load the board"
            onRetry={() => void board.refetch()}
          />
        ) : (
          <>
            <LeaderboardTable
              rows={rows}
              currentUserId={userId}
              caption={`${tier.label} tier, around your position`}
              stretch
            />
            {alone && (
              // Fills the rest of the card so a lone climber's tier never looks broken.
              <div className="grid flex-1 place-items-center py-6 text-center">
                <div className="flex flex-col items-center gap-2 text-soft">
                  <Mountain className="size-8 text-faint" aria-hidden="true" />
                  <p>You&apos;re the only climber in {tier.label} for now.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
