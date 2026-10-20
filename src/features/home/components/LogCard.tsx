import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { QuickPickChip } from '@/components/ui/QuickPickChip';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCatalog } from '@/features/activities/api';
import { useMyLogs } from '@/features/history/api';
import { NaturalInput } from '@/features/log-activity/components/NaturalInput';
import type { Category } from '@/lib/api/types';
import { CATEGORY_ICON } from '@/lib/utils/category';
import { RecentActivity } from './RecentActivity';
import { TodayStats } from './TodayStats';

const MAX_CHIPS = 4;

type Pick = { name: string; category: Category };

/**
 * Quick picks are the user's most-logged activities, derived from their history until the API
 * offers a "recent activities" endpoint. A new user gets the first active catalog entries.
 */
function useQuickPicks() {
  const logs = useMyLogs();
  const catalog = useCatalog();

  const picks = useMemo<Pick[]>(() => {
    if (logs.data && logs.data.length > 0) {
      const counts = new Map<string, { count: number; pick: Pick }>();
      for (const { activity } of logs.data) {
        if (!activity.active) continue;
        const entry = counts.get(activity.name) ?? {
          count: 0,
          pick: { name: activity.name, category: activity.category },
        };
        entry.count += 1;
        counts.set(activity.name, entry);
      }
      return [...counts.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, MAX_CHIPS)
        .map((e) => e.pick);
    }
    return (catalog.data ?? [])
      .filter((a) => a.active)
      .slice(0, MAX_CHIPS)
      .map((a) => ({ name: a.name, category: a.category }));
  }, [logs.data, catalog.data]);

  const loading = logs.isPending || (logs.data?.length === 0 && catalog.isPending);
  return { picks, loading };
}

/**
 * Left: heading, quick picks and the Log button. Right (an inset panel): a sentence box that
 * hands off to the Log sheet's draft → confirm flow, and today's numbers. Below 1280px the
 * right half stacks under the left.
 */
export function LogCard() {
  const { picks, loading } = useQuickPicks();
  const navigate = useNavigate();

  return (
    // The card, not the viewport, decides when two columns fit: it only splits once it has room
    // (≈720px), so a card squeezed beside the rank column stacks instead of cramping.
    <div className="@container">
      <section
        aria-labelledby="log-card-title"
        className="grid h-full gap-6 rounded-[20px] bg-accent p-6 text-accent-ink @2xl:grid-cols-2"
      >
        <div className="flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h2
              id="log-card-title"
              className="font-display text-4xl leading-tight font-extrabold tracking-tight @2xl:text-5xl"
            >
              What did you do?
            </h2>
            <p className="text-base opacity-80">Log it and watch the XP roll in.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {loading ? (
              <>
                <Skeleton className="h-14 bg-accent-ink/15" />
                <Skeleton className="h-14 bg-accent-ink/15" />
              </>
            ) : (
              picks.map((p) => (
                <QuickPickChip
                  key={p.name}
                  to={`/app/log?activity=${encodeURIComponent(p.name)}`}
                  label={p.name}
                  icon={CATEGORY_ICON[p.category]}
                  size="lg"
                />
              ))
            )}
            <QuickPickChip
              to="/app/log"
              label="Something else…"
              icon={Plus}
              size="lg"
              className="col-span-2"
            />
          </div>

          <Link
            to="/app/log"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 self-start rounded-[14px] bg-accent-ink px-6 text-[17px] font-bold text-accent no-underline transition hover:brightness-125"
          >
            <Plus className="size-5" strokeWidth={2.75} aria-hidden="true" />
            Log activity
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-6 rounded-2xl bg-bg p-6 text-text">
          <NaturalInput
            pending={false}
            error={null}
            placeholder="Tell us what you did… e.g. Studied Spring Boot for 90 min"
            onSubmit={(text) => void navigate(`/app/log?text=${encodeURIComponent(text)}`)}
          />
          <RecentActivity />
          <TodayStats />
        </div>
      </section>
    </div>
  );
}
