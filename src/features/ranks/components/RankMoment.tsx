import { useState } from 'react';
import { Link } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { TierBadge } from '@/components/ui/TierBadge';
import { qk } from '@/lib/api/queryKeys';
import type { RankCard } from '@/lib/api/types';
import { formatNumber } from '@/lib/utils/format';
import { useMyRank } from '../api';
import { nudgeFor, nudgeText, rankShift, stepLabel, type RankShift } from '../steps';
import { DivisionSteps } from './DivisionSteps';
import './moment.css';

function Headline({ shift, card }: { shift: RankShift; card: RankCard }) {
  if (shift.kind === 'tier' || shift.kind === 'division' || shift.kind === 'joined') {
    const text =
      shift.kind === 'tier'
        ? `You reached ${shift.to}`
        : shift.kind === 'division'
          ? `Promoted to ${shift.to}`
          : `You are on the mountain: ${shift.to}`;
    return (
      <div className="rank-rise flex items-center gap-3">
        <TierBadge tier={card.tier} size={44} />
        <p className="font-display text-3xl leading-none font-extrabold">{text}</p>
        {card.division && <DivisionSteps tier={card.tier} division={card.division} width={36} />}
      </div>
    );
  }
  if (shift.kind === 'places') {
    return (
      <p className="rank-rise font-display text-2xl leading-none font-extrabold">
        Up {shift.places} {shift.places === 1 ? 'place' : 'places'}
      </p>
    );
  }
  return null;
}

/**
 * The rank, after a session is logged. Ranks refresh about every 30 seconds, so this compares the
 * card as it was when the result opened with each refresh: a promotion or gained places get one
 * considered moment, and when nothing has changed it stays a quiet line.
 */
export function RankMoment() {
  const rank = useMyRank();
  const queryClient = useQueryClient();
  const [before] = useState(() => queryClient.getQueryData<RankCard | null>(qk.ranks.me()));
  const card = rank.data ?? null;
  const shift: RankShift = before === undefined ? { kind: 'none' } : rankShift(before, card);
  const nudge = card ? nudgeFor(card) : null;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-sm text-muted">Rank</h2>
      <div role="status" aria-live="polite" className="flex flex-col gap-3">
        {card && <Headline shift={shift} card={card} />}
      </div>
      {rank.isPending ? (
        <Skeleton className="h-8 w-40" />
      ) : card ? (
        <p className="font-bold">
          {stepLabel(card.tier, card.division)}
          <span className="font-mono text-soft">
            {' '}
            · #{formatNumber(card.position)} of {formatNumber(card.totalUsers)}
          </span>
        </p>
      ) : (
        <p className="text-soft">You&apos;ll be ranked after the next rank update.</p>
      )}
      {card && nudge && (
        <p className="text-sm text-soft">{nudgeText(nudge, card.division !== undefined)}</p>
      )}
      {shift.kind === 'none' && (
        <p className="text-sm text-muted">
          Ranks refresh about every 30 seconds, so a change can take a moment to show.
        </p>
      )}
      <Link
        to="/app/ranks"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent no-underline hover:underline"
      >
        Ranks &amp; leaderboards <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </Card>
  );
}
