import { Link } from 'react-router';
import { Mountain } from 'lucide-react';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { getTierInfo, RANK_TIERS } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/format';
import { useMyRank, useRankDistribution } from '../api';
import { climb, roman } from '../steps';
import { DivisionSteps } from './DivisionSteps';
import { markerPoint, nodePoint, ROW_H, rowOfTier, TRAIL_W, trailPath } from '../trail';

const SUMMIT = RANK_TIERS.length;

/**
 * The nine tiers as an upright climb: Summit on top, a switchback trail down the left, each row a
 * link to that tier's board. Bars are as long as the number of climbers in the tier, and a marker
 * shows where you are (your tier, then how far through it).
 */
export function TierMountain() {
  const distribution = useRankDistribution();
  const rank = useMyRank();

  if (distribution.isPending) {
    return (
      <div role="status" aria-label="Loading the mountain" className="flex flex-col gap-2">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }
  if (distribution.isError) {
    return (
      <ErrorPanel
        error={distribution.error}
        title="Couldn't load the tiers"
        onRetry={() => void distribution.refetch()}
      />
    );
  }

  const counts = new Map(distribution.data.map((d) => [d.tier, d.userCount]));
  const widest = Math.max(1, ...distribution.data.map((d) => d.userCount));
  const mine = rank.data ?? null;
  const marker = mine ? markerPoint(getTierInfo(mine.tier).order, climb(mine)) : null;
  const tiers = [...RANK_TIERS].reverse();
  const height = tiers.length * ROW_H;

  return (
    <div className="flex flex-col gap-4">
      <ol aria-label="Rank tiers, Summit to Basecamp" className="relative">
        <svg
          aria-hidden="true"
          width={TRAIL_W}
          height={height}
          viewBox={`0 0 ${TRAIL_W} ${height}`}
          className="pointer-events-none absolute top-0 left-0"
        >
          <path
            d={trailPath()}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {tiers.map((tier) => {
            const { x, y } = nodePoint(rowOfTier(tier.order));
            return tier.order === SUMMIT ? (
              <circle
                key={tier.id}
                cx={x}
                cy={y}
                r={11}
                fill="var(--tier-9)"
                stroke="var(--text)"
                strokeWidth={3}
              />
            ) : (
              <circle
                key={tier.id}
                cx={x}
                cy={y}
                r={7}
                fill={`var(--tier-${tier.order})`}
                stroke="var(--text)"
                strokeWidth={3}
              />
            );
          })}
          {marker && (
            <g data-testid="you-marker" transform={`translate(${marker.x} ${marker.y})`}>
              {/* A ring, so the tier node (the lime Summit one included) shows through. */}
              <circle r={14} fill="none" stroke="var(--accent)" strokeWidth={4} />
              <circle r={4} fill="var(--accent)" />
            </g>
          )}
        </svg>

        {tiers.map((tier) => {
          const count = counts.get(tier.id) ?? 0;
          const own = mine?.tier === tier.id;
          return (
            <li key={tier.id} aria-current={own ? 'true' : undefined}>
              <Link
                to={`/app/ranks/${tier.id}`}
                className={cn(
                  'flex items-center gap-3 rounded-xl py-2 pr-3 pl-16 no-underline transition hover:bg-surface-2',
                  own && 'bg-surface-2',
                )}
                style={{ height: ROW_H }}
              >
                <span data-testid="tier-label" className="flex w-32 shrink-0 flex-col sm:w-44">
                  <span className="flex items-center gap-2">
                    <span className="font-display text-[1.7rem] leading-none font-bold">
                      {tier.label}
                    </span>
                    {own && mine?.division && (
                      <>
                        <DivisionSteps tier={tier.id} division={mine.division} width={26} />
                        <span className="sr-only">, division {roman(mine.division)}</span>
                      </>
                    )}
                  </span>
                  <span className="truncate text-sm text-muted">
                    {/* On a phone your row swaps its band for "You are here"; the band stays readable. */}
                    <span className={cn(own && 'sr-only sm:not-sr-only')}>{tier.band}</span>
                    {own && (
                      <span className="font-medium text-accent">
                        <span className="hidden sm:inline"> · </span>You are here
                      </span>
                    )}
                  </span>
                </span>
                <span aria-hidden="true" className="flex min-w-0 flex-1 items-center">
                  {count === 0 ? (
                    <span className="h-5 w-full max-w-24 rounded-[3px] border border-dashed border-line-strong" />
                  ) : (
                    <span
                      className="h-5 rounded-[3px] border border-text/40"
                      style={{
                        width: `${Math.max(3, (count / widest) * 100)}%`,
                        background: `var(--tier-${tier.order})`,
                      }}
                    />
                  )}
                </span>
                <span className="w-16 shrink-0 text-right text-[15px] text-soft sm:w-24">
                  {count === 0 ? (
                    'Nobody yet'
                  ) : (
                    <>
                      {formatNumber(count)}
                      <span className="sr-only sm:not-sr-only">
                        {count === 1 ? ' climber' : ' climbers'}
                      </span>
                    </>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="flex items-center gap-2 text-sm text-muted">
        <Mountain className="size-4" aria-hidden="true" />
        Bar length is the number of climbers in each tier. Pick a tier to see who is in it.
      </p>
    </div>
  );
}
