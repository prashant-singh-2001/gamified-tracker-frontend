import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { RouteMap } from '@/components/route-map/RouteMap';
import { routeDistance, waypointLengths } from '@/components/route-map/routeGeometry';
import { buttonClass } from '@/components/ui/buttonStyles';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useMyRank } from '@/features/ranks/api';
import { nextTierUp, tierProgress } from '@/features/ranks/tierProgress';
import { isNotFound } from '@/lib/api/errors';
import { getTierInfo, RANK_TIERS, type RankCard } from '@/lib/api/types';
import { formatNumber, formatTopPercent } from '@/lib/utils/format';
import { TodayStats } from './TodayStats';

const TRAVEL_MS = 1400;

// The marker climbs to the user's place once per visit to the app, not on every return to Home.
let introPlayed = false;

/** Slim bar: how far up the tier band the user is, with the next tier as the goal. */
function TierBand({ card }: { card: RankCard }) {
  const info = getTierInfo(card.tier);
  const next = nextTierUp(card.tier);
  const progress = tierProgress(card);
  return (
    <div className="flex w-full max-w-[22rem] flex-col gap-2">
      <div
        role="progressbar"
        aria-label={`Progress through ${info.label}, towards ${next ? next.label : 'the top'}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        className="h-2 w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-sm text-muted">
        <span>
          {info.label} · {info.band}
        </span>
        <span>{next ? `→ ${next.label}` : 'Top tier'}</span>
      </div>
    </div>
  );
}

/** The route map with a marker at the climber's real place: their tier, then how far through it. */
function YouAreHere({ card }: { card: RankCard | null }) {
  const routeRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const tier = card?.tier;
  const percentile = card?.percentile;

  useEffect(() => {
    const route = routeRef.current;
    const marker = markerRef.current;
    if (!route || !marker || !tier || percentile === undefined) return;
    if (typeof route.getTotalLength !== 'function') return;

    const lengths = waypointLengths(route);
    const target = routeDistance(
      lengths,
      getTierInfo(tier).order,
      tierProgress({ tier, percentile }),
    );
    const place = (length: number) => {
      const { x, y } = route.getPointAtLength(length);
      marker.setAttribute('transform', `translate(${x} ${y})`);
      marker.setAttribute('opacity', '1');
    };

    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (introPlayed || still) {
      introPlayed = true;
      place(target);
      return;
    }

    introPlayed = true;
    const started = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - started) / TRAVEL_MS);
      place(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [tier, percentile]);

  return (
    <RouteMap animate={false} routeRef={routeRef}>
      {card && (
        <g ref={markerRef} opacity="0" data-testid="you-marker">
          <circle r="30" fill="var(--accent)" opacity="0.18" />
          <circle r="13" fill="var(--accent)" stroke="var(--surface)" strokeWidth="4" />
          <text
            x="-20"
            y="-38"
            className="route-label"
            textAnchor="end"
            fill="var(--accent)"
            stroke="var(--surface)"
            strokeWidth={7}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            You
          </text>
        </g>
      )}
    </RouteMap>
  );
}

function Panel({
  header,
  map,
  footer,
}: {
  header: React.ReactNode;
  map: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby="rank-hero-title"
      className="flex h-full flex-col overflow-hidden rounded-[18px] border border-line-strong bg-surface"
    >
      <div className="flex flex-col gap-5 p-6 pb-0 sm:p-8 sm:pb-0">{header}</div>
      <div aria-hidden="true" className="relative min-h-72 flex-1">
        {map}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 pb-5 sm:px-8">
        {footer}
      </div>
    </section>
  );
}

/** The hero of Home: where you stand on the nine-tier route. */
export function RankHero() {
  const rank = useMyRank();

  if (rank.isPending) return <CardSkeleton label="Loading your rank" />;
  if (rank.isError && !isNotFound(rank.error)) {
    return (
      <ErrorPanel
        error={rank.error}
        title="Couldn't load your rank"
        onRetry={() => void rank.refetch()}
      />
    );
  }

  if (rank.isError) {
    return (
      <Panel
        map={<YouAreHere card={null} />}
        header={
          <>
            <h2
              id="rank-hero-title"
              className="font-display text-[clamp(3rem,5vw,4.5rem)] leading-[0.92] font-extrabold text-balance"
            >
              You&apos;re not ranked yet
            </h2>
            <p className="text-lg text-soft">Log your first activity to get ranked.</p>
            <Link
              to="/app/log"
              className={buttonClass('primary', 'lg', 'self-start rounded-full px-7')}
            >
              Log your first activity
            </Link>
            <ol aria-label="Rank tiers, Basecamp to Summit" className="sr-only">
              {RANK_TIERS.map((t) => (
                <li key={t.id}>
                  {t.label}, {t.band}
                </li>
              ))}
            </ol>
          </>
        }
        footer={<p className="text-sm text-muted">Rank updates every few minutes.</p>}
      />
    );
  }

  const card = rank.data;
  const tier = getTierInfo(card.tier);

  return (
    <Panel
      map={<YouAreHere card={card} />}
      header={
        <>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <h2
              id="rank-hero-title"
              className="font-display text-[clamp(3.5rem,6vw,5.5rem)] leading-[0.9] font-extrabold"
            >
              {tier.label}
            </h2>
            <p className="flex items-baseline gap-4 pb-1 text-xl text-soft">
              <span className="font-display text-4xl leading-none font-bold text-text">
                {formatTopPercent(card.percentile)}
              </span>
              <span>
                #{formatNumber(card.position)} of {formatNumber(card.totalUsers)}
              </span>
            </p>
          </div>
          <div className="grid items-end gap-x-10 gap-y-5 sm:grid-cols-2">
            <TierBand card={card} />
            <TodayStats />
          </div>
        </>
      }
      footer={
        <>
          <Link
            to="/app/ranks"
            className="inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-accent no-underline hover:underline"
          >
            Open ranks &amp; leaderboards
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <p className="text-sm text-muted">Rank updates every few minutes.</p>
        </>
      }
    />
  );
}
