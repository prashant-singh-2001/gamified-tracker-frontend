import { useStreaks } from '@/features/activities/api';
import { isStreakAlive } from '@/features/activities/streaks';
import { useWeeklyReport } from '@/features/stats/api';
import { formatNumber } from '@/lib/utils/format';
import { serverToday } from '@/lib/utils/serverTime';

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="whitespace-nowrap">
        <span className={`font-display text-4xl leading-none font-bold ${tone}`}>{value}</span>
        {unit && (
          <>
            {' '}
            <span className="ml-0.5 text-sm text-muted">{unit}</span>
          </>
        )}
      </dd>
    </div>
  );
}

/**
 * Today at a glance, from endpoints Home already loads: today's XP and minutes are the last
 * (today's) item of the weekly report; the streak is the longest one that is still alive.
 */
export function TodayStats() {
  const report = useWeeklyReport();
  const streaks = useStreaks();

  const today = report.data?.dailyBreakdown.find((d) => d.date === serverToday());
  const best = Math.max(
    0,
    ...(streaks.data ?? []).filter((s) => isStreakAlive(s)).map((s) => s.currentStreak),
  );

  const loading = report.isPending;
  return (
    <section aria-label="Today" className="flex flex-col gap-3">
      <h3 className="sr-only">Today</h3>
      <dl className="grid grid-cols-3 gap-4">
        <Stat
          label="XP"
          value={loading ? '—' : formatNumber(Math.round(today?.totalXpEarned ?? 0))}
          tone="text-xp"
        />
        <Stat
          label="Minutes"
          value={loading ? '—' : formatNumber(today?.totalDurationMinutes ?? 0)}
          tone="text-text"
        />
        <Stat
          label="Best streak"
          value={streaks.isPending ? '—' : String(best)}
          unit={best === 1 ? 'day' : 'days'}
          tone="text-streak"
        />
      </dl>
    </section>
  );
}
