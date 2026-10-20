import { Link } from 'react-router';
import { ArrowRight, Mountain } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { buttonClass } from '@/components/ui/buttonStyles';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { LeaderboardTable, type LeaderboardRow } from '@/components/ui/LeaderboardTable';
import { TierBadge } from '@/components/ui/TierBadge';
import { useMyRank, useMyTierBoard } from '@/features/ranks/api';
import { neighboursOf } from '@/features/ranks/neighbours';
import { nextTierUp, tierProgress } from '@/features/ranks/tierProgress';
import { isNotFound } from '@/lib/api/errors';
import { getTierInfo, RANK_TIERS } from '@/lib/api/types';
import { useUserId } from '@/lib/auth/useUserId';
import { formatNumber, formatTopPercent } from '@/lib/utils/format';

const NEIGHBOURS = 5;

/** Shown to a user the backend hasn't ranked yet: the whole ladder and how to get on it. */
function Unranked() {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Mountain className="size-7 text-rank" aria-hidden="true" />
        <div>
          <h2 className="font-display text-xl font-extrabold">You're not ranked yet</h2>
          <p className="text-sm text-muted">Log your first activity to get ranked.</p>
        </div>
      </div>
      <ol className="flex flex-col-reverse gap-2" aria-label="Rank tiers, Basecamp to Summit">
        {RANK_TIERS.map((t) => (
          <li key={t.id} className="flex items-center gap-3 text-sm">
            <span className="w-32 shrink-0">
              <TierBadge tier={t.id} size={20} showLabel />
            </span>
            {/* Where the tier sits in the population: left edge = best, right edge = worst. */}
            <span aria-hidden="true" className="relative h-1.5 flex-1 rounded-full bg-line">
              <span
                className="absolute inset-y-0 rounded-full bg-rank/60"
                style={{ left: `${t.topFrom * 100}%`, width: `${(t.topTo - t.topFrom) * 100}%` }}
              />
            </span>
            <span className="w-20 shrink-0 text-right font-mono text-xs text-faint">{t.band}</span>
          </li>
        ))}
      </ol>
      <div className="mt-auto flex flex-col gap-3">
        <Link to="/app/log" className={buttonClass('primary')}>
          Log your first activity
        </Link>
        <p className="text-sm text-muted">Rank updates every few minutes.</p>
      </div>
    </Card>
  );
}

/** Slim bar: how far up the tier band the user is, with the next tier as the goal. */
function TierBand({
  progress,
  tier,
}: {
  progress: number;
  tier: Parameters<typeof tierProgress>[0];
}) {
  const info = getTierInfo(tier.tier);
  const next = nextTierUp(tier.tier);
  return (
    <div className="flex flex-col gap-2">
      <div
        role="progressbar"
        aria-label={`Progress through ${info.label}, towards ${next ? next.label : 'the top'}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-rank transition-[width] duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="flex justify-between font-mono text-xs text-muted">
        <span>
          {info.label} · {info.band}
        </span>
        <span>{next ? `→ ${next.label}` : 'Top tier'}</span>
      </div>
    </div>
  );
}

export function RankSummaryCard() {
  const rank = useMyRank();
  const userId = useUserId();
  const board = useMyTierBoard(rank.isSuccess);

  if (rank.isPending) return <CardSkeleton label="Loading your rank" />;
  if (rank.isError) {
    return isNotFound(rank.error) ? (
      <Unranked />
    ) : (
      <ErrorPanel
        error={rank.error}
        title="Couldn't load your rank"
        onRetry={() => void rank.refetch()}
      />
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
      }));
    } else {
      // Too far down a big tier to be in the loaded page: show the top, then pin the user.
      rows = [
        ...board.data.slice(0, NEIGHBOURS).map((m) => ({
          position: m.withinRankPosition,
          userId: m.userId,
          totalXp: m.totalXp,
          level: m.overallLevel,
        })),
        { position: card.position, userId, totalXp: card.totalXp, level: card.overallLevel },
      ];
    }
  }

  return (
    <Card className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TierBadge tier={card.tier} size={36} />
          <div>
            <p className="font-mono text-xs font-bold tracking-widest text-muted uppercase">
              Your rank
            </p>
            <h2 className="font-display text-2xl font-extrabold text-rank">{tier.label}</h2>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge tone="rank">{formatTopPercent(card.percentile)}</Badge>
          <span className="font-mono text-sm text-soft">
            #{formatNumber(card.position)} of {formatNumber(card.totalUsers)}
          </span>
        </div>
      </div>

      <TierBand progress={tierProgress(card)} tier={card} />

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

      <div className="mt-auto flex flex-col gap-1">
        <p className="text-sm text-muted">Rank updates every few minutes.</p>
        <Link
          to="/app/ranks"
          className="inline-flex min-h-11 items-center gap-2 self-start text-[15px] font-medium text-accent no-underline hover:underline"
        >
          Open ranks &amp; leaderboards
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
