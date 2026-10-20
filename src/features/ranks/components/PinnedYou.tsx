import { formatNumber } from '@/lib/utils/format';

type PinnedYouProps = {
  position: number;
  xp: number;
  level?: number;
  /** "Ridge II", when divisions are known. */
  step?: string;
};

/** A bar stuck above the tab bar showing where you are while your row is out of view. */
export function PinnedYou({ position, xp, level, step }: PinnedYouProps) {
  return (
    <div
      role="group"
      aria-label="Your place"
      className="sticky bottom-24 z-20 mt-4 flex items-center gap-4 rounded-xl border border-accent bg-surface px-4 py-3 shadow-[0_12px_32px_-16px_rgb(14_27_38/0.45)] lg:bottom-4"
    >
      <span className="font-mono text-sm text-muted">#{formatNumber(position)}</span>
      <span className="flex-1 font-bold">
        You
        {step && <span className="font-normal text-muted"> · {step}</span>}
      </span>
      {level !== undefined && <span className="font-mono text-sm text-muted">Lv {level}</span>}
      <span className="font-mono text-sm font-bold text-xp">{formatNumber(Math.round(xp))}</span>
    </div>
  );
}
