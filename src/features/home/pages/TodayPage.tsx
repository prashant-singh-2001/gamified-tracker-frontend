import { Link } from 'react-router';
import { Mountain, Plus } from 'lucide-react';
import { buttonClass } from '@/components/ui/buttonStyles';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { isNotFound } from '@/lib/api/errors';
import { useMyRank } from '@/features/ranks/api';
import { RankCard } from '@/features/ranks/components/RankCard';

export default function TodayPage() {
  const rank = useMyRank();

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Today</h1>
        <Link to="/app/log" className={buttonClass('primary', 'lg')}>
          <Plus className="size-5" aria-hidden="true" />
          Log activity
        </Link>
      </div>

      {rank.isPending ? (
        <CardSkeleton label="Loading your rank" />
      ) : rank.isError ? (
        isNotFound(rank.error) ? (
          // The backend answers 404 until the first rank recompute includes this user.
          <EmptyState
            icon={Mountain}
            title="You're not ranked yet"
            description="Log your first activity to earn XP. Ranks refresh every few minutes."
            action={
              <Link to="/app/log" className={buttonClass('primary')}>
                Log your first activity
              </Link>
            }
          />
        ) : (
          <ErrorPanel
            error={rank.error}
            title="Couldn't load your rank"
            onRetry={() => void rank.refetch()}
          />
        )
      ) : (
        <RankCard rank={rank.data} />
      )}
    </section>
  );
}
