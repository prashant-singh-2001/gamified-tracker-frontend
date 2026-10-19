import { useMemo } from 'react';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { QuickPickChip } from '@/components/ui/QuickPickChip';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCatalog } from '@/features/activities/api';
import { useMyLogs } from '@/features/history/api';
import type { Category } from '@/lib/api/types';
import { CATEGORY_ICON } from '@/lib/utils/category';

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

export function LogCard() {
  const { picks, loading } = useQuickPicks();

  return (
    <section
      aria-labelledby="log-card-title"
      className="flex flex-col gap-5 rounded-[20px] bg-accent p-5 text-accent-ink sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id="log-card-title" className="font-display text-3xl font-extrabold tracking-tight">
          What did you do?
        </h2>
        <p className="text-[15px] opacity-80">Log it and watch the XP roll in.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {loading ? (
          <>
            <Skeleton className="h-11 w-28 bg-accent-ink/15" />
            <Skeleton className="h-11 w-32 bg-accent-ink/15" />
            <Skeleton className="h-11 w-24 bg-accent-ink/15" />
          </>
        ) : (
          picks.map((p) => (
            <QuickPickChip
              key={p.name}
              to={`/app/log?activity=${encodeURIComponent(p.name)}`}
              label={p.name}
              icon={CATEGORY_ICON[p.category]}
            />
          ))
        )}
        <QuickPickChip to="/app/log" label="Something else…" icon={Plus} />
      </div>

      <Link
        to="/app/log"
        className="inline-flex min-h-[52px] items-center justify-center gap-2 self-start rounded-[14px] bg-accent-ink px-6 text-[17px] font-bold text-accent no-underline transition hover:brightness-125"
      >
        <Plus className="size-5" strokeWidth={2.75} aria-hidden="true" />
        Log activity
      </Link>
    </section>
  );
}
