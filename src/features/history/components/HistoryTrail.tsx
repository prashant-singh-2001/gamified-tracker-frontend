import { formatNumber } from '@/lib/utils/format';
import type { DayGroup } from '../group';
import { LogRow } from './LogRow';

/**
 * The logbook: one magenta trail down the left edge, a camp on it for every day (the day and what
 * counted that day), and that day's logs hanging off it. The trail runs unbroken across pages.
 */
export function HistoryTrail({ groups, search }: { groups: DayGroup[]; search: string }) {
  return (
    <ol className="relative flex flex-col gap-6">
      <span
        aria-hidden="true"
        className="absolute top-3 bottom-0 left-[6px] w-[3px] rounded-full bg-accent"
      />
      {groups.map((group) => (
        <li key={group.key} className="relative">
          <span
            aria-hidden="true"
            className="absolute top-[7px] left-0 size-[15px] rounded-full border-[3px] border-text bg-surface"
          />
          <h2 className="flex flex-wrap items-baseline gap-x-3 pl-9">
            <span className="font-display text-3xl leading-none font-extrabold">{group.label}</span>
            {group.xp > 0 && (
              <span className="font-mono text-[15px] font-bold text-xp">
                +{formatNumber(Math.round(group.xp))} XP
              </span>
            )}
          </h2>
          <ul className="mt-2 flex flex-col pl-8" aria-label={`Logs on ${group.label}`}>
            {group.logs.map((log) => (
              <li key={log.id} className="border-b border-line last:border-0">
                <LogRow log={log} search={search} />
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
