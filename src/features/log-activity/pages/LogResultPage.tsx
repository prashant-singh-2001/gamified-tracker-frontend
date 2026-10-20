import { Link, useParams } from 'react-router';
import { SearchX } from 'lucide-react';
import { buttonClass } from '@/components/ui/buttonStyles';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { isNotFound } from '@/lib/api/errors';
import { useLog } from '../api';
import { useLevelUpForLog } from '../outcome';
import { Receipt } from '../components/Receipt';
import { ResultAnalytics } from '../components/ResultAnalytics';
import { ResultHeader } from '../components/ResultHeader';

/**
 * The payoff of the loop, as a full page rather than a toast: header (by outcome) → receipt →
 * other analytics → Done / Log another. A pending-review result gets only "Done".
 */
export default function LogResultPage() {
  const { logId } = useParams();
  const logQuery = useLog(logId);
  const log = logQuery.data;
  const levelUp = useLevelUpForLog(log);

  if (logQuery.isPending) return <CardSkeleton label="Loading your result" />;

  if (logQuery.isError || !log) {
    return isNotFound(logQuery.error) ? (
      <EmptyState
        icon={SearchX}
        title="We couldn't find that log"
        description="It may belong to another account, or it no longer exists."
        action={
          <Link to="/app" className={buttonClass('primary')}>
            Back to Home
          </Link>
        }
      />
    ) : (
      <ErrorPanel
        error={logQuery.error}
        title="Couldn't load this result"
        onRetry={() => void logQuery.refetch()}
      />
    );
  }

  const pendingReview = log.reviewStatus === 'FLAGGED';

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <ResultHeader log={log} levelUp={levelUp} />
      <Receipt log={log} />
      <ResultAnalytics log={log} />

      <div className="flex flex-wrap gap-3 pt-2">
        <Link to="/app" className={buttonClass('primary', 'lg', 'flex-1')}>
          Done
        </Link>
        {!pendingReview && log.reviewStatus !== 'REJECTED' && (
          <Link to="/app/log" className={buttonClass('secondary', 'lg')}>
            Log another
          </Link>
        )}
      </div>
    </div>
  );
}
