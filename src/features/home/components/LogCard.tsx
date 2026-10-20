import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';
import { QuickPickChip } from '@/components/ui/QuickPickChip';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCatalog } from '@/features/activities/api';
import { useMyLogs } from '@/features/history/api';
import { NaturalInput } from '@/features/log-activity/components/NaturalInput';
import type { Category } from '@/lib/api/types';
import { CATEGORY_ICON } from '@/lib/utils/category';
import { RecentActivity } from './RecentActivity';

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
 * The ink panel: what did you do? A sentence box that hands off to the Log sheet's draft → confirm
 * flow, the user's most-logged activities as one-tap tiles, and the latest few logs.
 */
export function LogCard() {
  const { picks, loading } = useQuickPicks();
  const navigate = useNavigate();

  return (
    <section
      aria-labelledby="log-card-title"
      className="panel-ink flex flex-col gap-7 rounded-[18px] p-6 sm:p-8"
    >
      <div className="flex flex-col gap-2">
        <h2
          id="log-card-title"
          className="font-display text-5xl leading-[0.92] font-extrabold sm:text-6xl"
        >
          What did you do?
        </h2>
        <p className="text-lg text-soft">Log it and watch the XP roll in.</p>
      </div>

      <NaturalInput
        pending={false}
        error={null}
        placeholder="Tell us what you did… e.g. Studied Spring Boot for 90 min"
        onSubmit={(text) => void navigate(`/app/log?text=${encodeURIComponent(text)}`)}
      />

      <div className="grid grid-cols-2 gap-3">
        {loading ? (
          <>
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
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

      <RecentActivity />
    </section>
  );
}
