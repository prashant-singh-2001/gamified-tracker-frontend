import { useMemo } from 'react';
import { Link, Outlet, useNavigate, useSearchParams } from 'react-router';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { buttonClass } from '@/components/ui/buttonStyles';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorPanel } from '@/components/ui/ErrorPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNumber } from '@/lib/utils/format';
import { useLogPages } from '../api';
import { HistoryFilters } from '../components/HistoryFilters';
import { HistoryTrail } from '../components/HistoryTrail';
import { RankedList } from '../components/RankedList';
import { filtersFromParams, filtersToSearch, isFiltered, isRanked, SORT_LABEL } from '../filters';
import { groupByDay } from '../group';
import type { HistoryFilters as Filters } from '../types';

const ORDER: Record<Filters['sort'], string> = {
  newest: 'newest first',
  oldest: 'oldest first',
  xp: 'most XP first',
  longest: 'longest first',
};

/**
 * Every log, newest first, grouped by day along one trail. The server filters and pages (50 at a
 * time); the filters live in the URL, so they survive a refresh and the detail sheet that opens on
 * top of this page keeps them.
 */
export default function HistoryPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const filters = filtersFromParams(params);
  const search = filtersToSearch(filters);
  const pages = useLogPages(filters);

  const logs = useMemo(() => (pages.data?.pages ?? []).flatMap((p) => p.content), [pages.data]);
  const groups = useMemo(() => groupByDay(logs), [logs]);
  const total = pages.data?.pages[0]?.totalElements ?? 0;
  const filtered = isFiltered(filters);

  function change(next: Filters) {
    void navigate(`/app/history${filtersToSearch(next)}`, { replace: true });
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[clamp(3.5rem,7vw,6rem)] leading-[0.88] font-extrabold">
          History
        </h1>
        <p className="text-lg text-soft" aria-live="polite">
          {pages.isSuccess
            ? total === 0
              ? filtered
                ? 'No logs match.'
                : 'Every session you log lands here.'
              : `${formatNumber(total)} ${total === 1 ? 'log' : 'logs'}${filtered ? ' match' : ''}, ${ORDER[filters.sort]}.`
            : 'Every session you log lands here.'}
        </p>
      </header>

      <HistoryFilters filters={filters} onChange={change} />

      {pages.isPending ? (
        <div role="status" aria-label="Loading your history" className="flex flex-col gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : pages.isError ? (
        <ErrorPanel
          error={pages.error}
          title="Couldn't load your history"
          onRetry={() => void pages.refetch()}
        />
      ) : logs.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={History}
            title="No logs for these filters"
            description="Try another activity or a longer range."
            action={
              <Link to="/app/history" replace className={buttonClass('secondary', 'lg')}>
                Clear filters
              </Link>
            }
          />
        ) : (
          <EmptyState
            icon={History}
            title="No logs yet"
            description="Log your first session and it will show up here."
            action={
              <Link to="/app/log" className={buttonClass('primary', 'lg')}>
                Log activity
              </Link>
            }
          />
        )
      ) : (
        <>
          {isRanked(filters.sort) ? (
            <RankedList logs={logs} search={search} label={`Logs, ${SORT_LABEL[filters.sort]}`} />
          ) : (
            <HistoryTrail groups={groups} search={search} />
          )}
          {pages.hasNextPage && (
            <Button
              variant="secondary"
              size="lg"
              className="self-start rounded-full"
              loading={pages.isFetchingNextPage}
              onClick={() => void pages.fetchNextPage()}
            >
              Show more
            </Button>
          )}
        </>
      )}

      {/* /app/history/:logId renders its sheet here, on top of the list. */}
      <Outlet />
    </div>
  );
}
