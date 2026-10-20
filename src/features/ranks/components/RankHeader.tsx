import { Link } from 'react-router';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { buttonClass } from '@/components/ui/buttonStyles';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { TierBadge } from '@/components/ui/TierBadge';
import type { RankCard } from '@/lib/api/types';
import { formatLocalTime } from '@/lib/utils/serverTime';
import { formatNumber } from '@/lib/utils/format';
import { useMyRank } from '../api';
import { climb, movementOf, nudgeFor, nudgeText, stepLabel, topShare } from '../steps';
import { DivisionSteps } from './DivisionSteps';
import { MovementChip } from './MovementChip';

/** How far through the current division (or, without divisions, the tier) with the next step as the goal. */
function Progress({ card }: { card: RankCard }) {
  const withDivisions = card.division !== undefined;
  const here = stepLabel(card.tier, card.division);
  const nudge = nudgeFor(card);
  const top = nudge?.kind === 'top';
  const value = withDivisions ? (top ? 1 : (card.divisionProgress ?? 0)) : climb(card);
  const goal =
    card.division && card.nextDivision && card.nextDivisionTier
      ? stepLabel(card.nextDivisionTier, card.nextDivision)
      : top
        ? 'The top'
        : null;

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div
        role="progressbar"
        aria-label={goal ? `Progress through ${here}, towards ${goal}` : `Progress through ${here}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value * 100)}
        className="h-2.5 w-full overflow-hidden rounded-full bg-line"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 motion-reduce:transition-none"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <div className="flex justify-between gap-3 text-sm text-muted" aria-hidden="true">
        <span>{here}</span>
        {goal && <span>{goal}</span>}
      </div>
      {nudge && <p className="font-medium text-text">{nudgeText(nudge, withDivisions)}</p>}
    </div>
  );
}

/** Who you are on the mountain: step, place, movement, progress and the nudge to the next step. */
export function RankHeader() {
  const rank = useMyRank();

  if (rank.isPending) {
    return (
      <div role="status" aria-label="Loading your rank" className="flex flex-col gap-4">
        <Skeleton className="h-20 w-72" />
        <Skeleton className="h-6 w-80" />
        <Skeleton className="h-16 w-full max-w-md" />
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
        <p className="text-lg text-soft">Log your first session to get on the mountain.</p>
        <Link to="/app/log" className={buttonClass('primary', 'lg', 'rounded-full px-7')}>
          Log your first activity
        </Link>
        <p className="text-sm text-muted">Ranks refresh about every 30 seconds.</p>
      </header>
    );
  }

  const withDivisions = card.division !== undefined;
  const movement = movementOf(card);

  return (
    <header className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div className="flex items-end gap-4">
          <TierBadge tier={card.tier} size={72} className="mb-1 hidden sm:inline-flex" />
          <h1 className="font-display text-[clamp(3.5rem,8vw,6.5rem)] leading-[0.88] font-extrabold">
            {stepLabel(card.tier, card.division)}
          </h1>
          {card.division && (
            <DivisionSteps tier={card.tier} division={card.division} width={54} className="mb-2" />
          )}
        </div>
        <p className="flex flex-wrap items-baseline gap-x-5 gap-y-1 pb-1 text-xl text-soft">
          <span className="font-display text-4xl leading-none font-bold text-text">
            {topShare(card.percentile)}
          </span>
          <span className="font-mono">
            #<AnimatedNumber value={card.position} /> of {formatNumber(card.totalUsers)}
          </span>
        </p>
      </div>

      {movement && <MovementChip movement={movement} />}
      <Progress card={card} />

      <p className="flex flex-wrap items-baseline gap-x-8 gap-y-1 text-soft">
        <span className="flex items-baseline gap-2">
          <span className="text-sm text-muted">Lifetime XP</span>
          <AnimatedNumber value={card.totalXp} className="font-mono font-bold text-xp" />
        </span>
        <span>Level {card.overallLevel}</span>
      </p>

      {withDivisions && (
        <p className="max-w-prose text-sm text-muted">
          Your place follows your recent form: XP from the last couple of weeks counts most, so it
          moves as you log and as you pause.
        </p>
      )}
      <p className="text-sm text-muted">
        {withDivisions
          ? `Updated ${formatLocalTime(card.updatedAt)}. Ranks refresh about every 30 seconds.`
          : 'Rank updates every few minutes.'}
      </p>
    </header>
  );
}
