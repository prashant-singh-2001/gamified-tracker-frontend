import type { ActivityLogResponse } from '@/features/log-activity/types';
import { LogRow } from './LogRow';

/**
 * Logs ranked by XP or by length: a plain numbered list, since the order is the point. The trail
 * groups by day, which would hide it. Each row names its day instead.
 */
export function RankedList({
  logs,
  search,
  label,
}: {
  logs: readonly ActivityLogResponse[];
  search: string;
  label: string;
}) {
  return (
    <ol aria-label={label} className="flex flex-col">
      {logs.map((log, i) => (
        <li key={log.id} className="flex items-center gap-2 border-b border-line last:border-0">
          <span aria-hidden="true" className="w-9 shrink-0 text-right font-mono text-sm text-muted">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <LogRow log={log} search={search} showDate />
          </div>
        </li>
      ))}
    </ol>
  );
}
