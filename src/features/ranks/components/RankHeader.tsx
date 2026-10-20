import { Link } from 'react-router';
import { buttonClass } from '@/components/ui/buttonStyles';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { getTierInfo } from '@/lib/api/types';
import { formatNumber, formatTopPercent } from '@/lib/utils/format';
import { useMyRank } from '../api';

/** Who you are on the mountain: tier, place, level and how far the next tier is. */
export function RankHeader() {
  const rank = useMyRank();

  if (rank.isPending) {
    return (
      <div role="status" aria-label="Loading your rank" className="flex flex-col gap-3">
        <Skeleton className="h-16 w-64" />
        <Skeleton className="h-6 w-80" />
      </div>
    );
  }
  if (rank.isError) {
    return (
      <ErrorPanel
        error={rank.error}
        title="Couldn't load your rank"
        onRetry={() => void rank.refetch()}
      />
    );
  }

  const card = rank.data;
  if (card === null) {
    return (
      <header className="flex flex-col items-start gap-3">
        <h1 className="font-display text-[clamp(3rem,6vw,5rem)] leading-[0.9] font-extrabold">
          You&apos;re not ranked yet
        </h1>
        <p className="text-lg text-soft">Log your first activity to get on the mountain.</p>
        <Link to="/app/log" className={buttonClass('primary', 'lg', 'rounded-full px-7')}>
          Log your first activity
        </Link>
        <p className="text-sm text-muted">Rank updates every few minutes.</p>
      </header>
    );
  }

  const tier = getTierInfo(card.tier);
  const nudge =
    card.nextTier && card.xpToNextTier != null
      ? `${formatNumber(Math.ceil(card.xpToNextTier))} XP to ${getTierInfo(card.nextTier).label}`
      : card.nextTier === null
        ? 'Top tier'
        : null;

  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
        <h1 className="font-display text-[clamp(3.5rem,7vw,6rem)] leading-[0.88] font-extrabold">
          {tier.label}
        </h1>
        <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1 pb-1 text-xl text-soft">
          <span className="font-display text-4xl leading-none font-bold text-text">
            {formatTopPercent(card.percentile)}
          </span>
          <span>
            #{formatNumber(card.position)} of {formatNumber(card.totalUsers)}
          </span>
          <span>Level {card.overallLevel}</span>
        </p>
      </div>
      <p className="text-soft">
        {nudge && <span className="font-medium text-text">{nudge}</span>}
        {nudge && ' · '}
        Rank updates every few minutes.
      </p>
    </header>
  );
}
