import { Card } from '@/components/ui/Card';
import {
  formatDuration,
  formatMultiplier,
  formatNumber,
  formatTimeRange,
} from '@/lib/utils/format';
import { CATEGORY_ICON } from '@/lib/utils/category';
import { fromServerDateTime } from '@/lib/utils/serverTime';
import type { ActivityLogResponse } from '../types';

/** Activity logged · time logged · XP gained, with the multipliers that applied. */
export function Receipt({ log }: { log: ActivityLogResponse }) {
  const Icon = CATEGORY_ICON[log.activity.category];
  const held = log.reviewStatus === 'FLAGGED';
  const none = log.reviewStatus === 'REJECTED';
  const resolution = log.nameResolution;

  return (
    <section aria-label="Receipt" className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex flex-col gap-1.5 p-4">
          <p className="text-sm text-muted">Activity logged</p>
          <p className="flex items-center gap-2 font-bold">
            <Icon className="size-4 shrink-0 text-soft" aria-hidden="true" />
            {log.activity.name}
          </p>
        </Card>

        <Card className="flex flex-col gap-1.5 p-4">
          <p className="text-sm text-muted">Time logged</p>
          <p className="font-mono font-bold">{formatDuration(log.durationMinutes)}</p>
          <p className="text-sm text-soft">
            {formatTimeRange(fromServerDateTime(log.startTime), fromServerDateTime(log.endTime))}
          </p>
        </Card>

        <Card className="flex flex-col gap-1.5 p-4">
          <p className="text-sm text-muted">{held ? 'XP on hold' : 'XP gained'}</p>
          <p
            className={`font-mono font-bold ${held ? 'text-pending' : none ? 'text-muted' : 'text-xp'}`}
          >
            {none ? '0 XP' : `${formatNumber(Math.round(log.xpEarned))} XP`}
          </p>
          {!held && !none && (log.bonusApplied || log.streakMultiplier > 1) && (
            <p className="flex flex-wrap gap-x-3 font-mono text-sm text-soft">
              {log.bonusApplied && <span>{formatMultiplier(log.bonusMultiplier)} bonus</span>}
              {log.streakMultiplier > 1 && (
                <span>{formatMultiplier(log.streakMultiplier)} streak</span>
              )}
            </p>
          )}
        </Card>
      </div>

      {resolution && (
        <p className="text-sm text-soft">
          Logged as <strong className="text-text">{resolution.resolvedName}</strong> (you typed{' '}
          <em>{resolution.requestedName}</em>).
        </p>
      )}
    </section>
  );
}
