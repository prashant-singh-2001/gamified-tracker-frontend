import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { Receipt } from '@/features/log-activity/components/Receipt';
import { useLog } from '../api';

/**
 * One log, as a sheet over History: the receipt from after logging, plus why it counted or did
 * not. Closing goes back to the list with its filters kept.
 */
export default function LogDetailPage() {
  const { logId } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const log = useLog(logId);

  return (
    <BottomSheet
      open
      title="Log details"
      onClose={() => void navigate(`/app/history${search}`, { replace: true })}
    >
      {log.isPending ? (
        <div role="status" aria-label="Loading this log" className="flex flex-col gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      ) : log.isError ? (
        <ErrorPanel
          error={log.error}
          title="Couldn't load this log"
          onRetry={() => void log.refetch()}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <Receipt log={log.data} />
          <Link
            to={`/app/activities/${log.data.activity.id}`}
            className="self-start text-[15px] font-medium text-accent no-underline hover:underline"
          >
            Your level in {log.data.activity.name}
          </Link>
          {log.data.reviewStatus === 'FLAGGED' && (
            <p className="text-soft">An admin is reviewing this unusually long session.</p>
          )}
          {log.data.reviewStatus === 'REJECTED' && <p className="text-soft">No XP awarded.</p>}
          {log.data.notes && (
            <section aria-label="Notes" className="flex flex-col gap-1">
              <h3 className="text-sm text-muted">Notes</h3>
              <p className="whitespace-pre-wrap">{log.data.notes}</p>
            </section>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
