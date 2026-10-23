import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { toApiError } from '@/lib/api/errors';
import { formatNumber } from '@/lib/utils/format';
import { useRecomputeRanks } from '../api';

/** Recalculates every tier now, instead of waiting for the next automatic refresh. */
export function RecomputeCard() {
  const recompute = useRecomputeRanks();
  const [last, setLast] = useState<{ users: number; at: string } | null>(null);

  function run() {
    recompute.mutate(undefined, {
      onSuccess: (users) =>
        setLast({
          users,
          at: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        }),
    });
  }

  return (
    <Card className="flex flex-col gap-3" role="region" aria-labelledby="recompute-title">
      <h2 id="recompute-title" className="font-display text-3xl leading-none font-extrabold">
        Recompute ranks
      </h2>
      <p className="max-w-prose text-soft">
        Recalculates every user&apos;s tier and division now, instead of waiting for the next
        automatic refresh (about every 30 seconds). Safe to run at any time.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button loading={recompute.isPending} onClick={run}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Recompute ranks
        </Button>
        <p aria-live="polite" className="text-[15px]">
          {recompute.isPending && 'Recomputing…'}
          {!recompute.isPending && recompute.isError && (
            <span role="alert" className="text-danger">
              {toApiError(recompute.error).message || "Couldn't recompute the ranks."} Try again.
            </span>
          )}
          {!recompute.isPending && !recompute.isError && last && (
            <>
              Ranked <span className="font-mono font-bold">{formatNumber(last.users)}</span>{' '}
              {last.users === 1 ? 'user' : 'users'} at {last.at}.
            </>
          )}
        </p>
      </div>
    </Card>
  );
}
