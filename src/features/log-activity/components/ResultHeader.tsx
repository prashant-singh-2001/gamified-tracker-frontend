import { CircleCheck, Clock, X } from 'lucide-react';
import { useCountUp } from '@/lib/hooks/useCountUp';
import { formatNumber } from '@/lib/utils/format';
import type { ActivityLogResponse } from '../types';

type ResultHeaderProps = {
  log: ActivityLogResponse;
  /** Set once the gamification service has reported a level-up for this log. */
  levelUp: { oldLevel: number; newLevel: number } | null;
};

function XpCounter({ xp }: { xp: number }) {
  const value = useCountUp(xp, 600);
  return (
    <p
      className="font-mono text-5xl font-bold text-xp sm:text-6xl"
      aria-label={`${Math.round(xp)} XP earned`}
    >
      <span aria-hidden="true">+{formatNumber(Math.round(value))} XP</span>
    </p>
  );
}

/** The payoff moment. The outcome decides the tone: celebratory, calm, or neutral. */
export function ResultHeader({ log, levelUp }: ResultHeaderProps) {
  const name = log.activity.name;

  if (log.reviewStatus === 'FLAGGED') {
    return (
      <header
        role="status"
        className="flex flex-col items-center gap-3 rounded-[20px] border border-pending/40 bg-surface p-8 text-center"
      >
        <Clock className="size-10 text-pending" aria-hidden="true" />
        <h1 className="font-display text-3xl font-extrabold text-pending">Saved — XP on hold</h1>
        <p className="max-w-sm text-soft">
          Unusually long session; an admin will review it before the XP counts.
        </p>
        <p className="font-mono text-2xl font-bold text-pending">
          {formatNumber(Math.round(log.xpEarned))} XP on hold
        </p>
        <p className="text-sm text-muted">{name}</p>
      </header>
    );
  }

  if (log.reviewStatus === 'REJECTED') {
    return (
      <header
        role="status"
        className="flex flex-col items-center gap-3 rounded-[20px] border border-danger/40 bg-surface p-8 text-center"
      >
        <X className="size-10 text-danger" aria-hidden="true" />
        <h1 className="font-display text-3xl font-extrabold">No XP awarded</h1>
        <p className="max-w-sm text-soft">
          An admin reviewed this session and didn&apos;t count it.
        </p>
        <p className="text-sm text-muted">{name}</p>
      </header>
    );
  }

  return (
    <header
      role="status"
      className="relative flex flex-col items-center gap-3 overflow-hidden rounded-[20px] border border-line bg-surface p-8 text-center"
    >
      {levelUp ? (
        <div className="relative grid place-items-center py-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              aria-hidden="true"
              className="absolute size-20 rounded-full border-2 border-accent"
              style={{ animation: `burst 900ms ease-out ${i * 150}ms both` }}
            />
          ))}
          <div
            className="relative grid size-20 place-items-center rounded-[24px] bg-accent font-mono text-3xl font-bold text-accent-ink"
            style={{ animation: 'badge-in 500ms ease-out both' }}
          >
            {levelUp.newLevel}
          </div>
        </div>
      ) : (
        <CircleCheck className="size-10 text-accent" aria-hidden="true" />
      )}

      {levelUp ? (
        <>
          <h1 className="font-display text-4xl font-extrabold">Level {levelUp.newLevel}!</h1>
          <p className="text-soft">
            {name}: level {levelUp.oldLevel} → {levelUp.newLevel}
          </p>
        </>
      ) : (
        <h1 className="sr-only">Activity logged</h1>
      )}

      <XpCounter xp={log.xpEarned} />
      {!levelUp && <p className="text-lg text-soft">{name}</p>}
    </header>
  );
}
