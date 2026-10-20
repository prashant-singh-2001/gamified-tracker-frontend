import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, Mountain } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { LeaderboardTable } from '@/components/ui/LeaderboardTable';
import { Skeleton } from '@/components/ui/Skeleton';
import { TierBadge } from '@/components/ui/TierBadge';
import { useMyRank, useRankDistribution, useTierBoard } from '@/features/ranks/api';
import { getTierInfo, RANK_TIERS, type RankTier } from '@/lib/api/types';
import { useUserId } from '@/lib/auth/useUserId';

const ROWS = 8;

const stepButton =
  'grid size-11 shrink-0 place-items-center rounded-xl border border-line-strong text-soft transition hover:text-text disabled:cursor-not-allowed disabled:opacity-40';

/** Top eight of any tier. Starts on the user's own tier; arrows step down/up the mountain. */
export function TierBoardCard() {
  const userId = useUserId();
  const rank = useMyRank();
  const [picked, setPicked] = useState<RankTier | null>(null);
  // Unranked users start at the bottom of the mountain, where everyone begins.
  const tier = picked ?? rank.data?.tier ?? 'BASECAMP';
  const board = useTierBoard(tier, ROWS);
  const distribution = useRankDistribution();

  const info = getTierInfo(tier);
  const lower = RANK_TIERS.find((t) => t.order === info.order - 1);
  const higher = RANK_TIERS.find((t) => t.order === info.order + 1);
  const isMine = rank.data?.tier === tier;

  const rows = board.data ?? [];
  const inTier = distribution.data?.find((d) => d.tier === tier)?.userCount ?? rows.length;
  const short = rows.length < ROWS;

  return (
    <Card className="flex flex-col gap-5">
      <h2 className="font-display text-3xl leading-none font-extrabold">Top of the tiers</h2>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Lower tier"
          disabled={!lower}
          onClick={() => lower && setPicked(lower.id)}
          className={stepButton}
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
        </button>
        <div className="flex min-w-0 flex-col items-center gap-1" aria-live="polite">
          <span className="flex items-center gap-2">
            <TierBadge tier={tier} size={24} />
            <span className="font-display text-lg font-extrabold text-rank">{info.label}</span>
          </span>
          <span className="flex items-center gap-2 font-mono text-xs text-muted">
            {info.band}
            {isMine && <Badge tone="rank">Your tier</Badge>}
          </span>
        </div>
        <button
          type="button"
          aria-label="Higher tier"
          disabled={!higher}
          onClick={() => higher && setPicked(higher.id)}
          className={stepButton}
        >
          <ChevronRight className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {board.isPending ? (
          <div role="status" aria-label="Loading leaderboard" className="flex flex-col gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : board.isError ? (
          <ErrorPanel
            error={board.error}
            title="Couldn't load this tier"
            onRetry={() => void board.refetch()}
          />
        ) : (
          <>
            {rows.length > 0 && (
              <LeaderboardTable
                rows={rows.map((m) => ({
                  position: m.withinRankPosition,
                  userId: m.userId,
                  totalXp: m.totalXp,
                  level: m.overallLevel,
                }))}
                currentUserId={userId}
                caption={`Top ${ROWS} in ${info.label}`}
                stretch
              />
            )}
            {short && (
              // Fills the rest of the card so a quiet tier never looks broken.
              <div className="grid flex-1 place-items-center gap-2 py-6 text-center">
                <div className="flex flex-col items-center gap-2 text-soft">
                  <Mountain className="size-8 text-faint" aria-hidden="true" />
                  <p>
                    {inTier === 0
                      ? `No one in ${info.label} yet`
                      : `${inTier} ${inTier === 1 ? 'climber' : 'climbers'} in ${info.label}`}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Link
        to={`/app/ranks/${tier}`}
        className="mt-auto inline-flex min-h-11 items-center self-start text-[15px] font-medium text-accent no-underline hover:underline"
      >
        See the full {info.label} board
      </Link>
    </Card>
  );
}
