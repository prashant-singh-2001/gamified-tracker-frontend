import { getTierInfo, type RankTier } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

type TierBadgeProps = {
  tier: RankTier;
  size?: number;
  /** Also render the tier name beside the glyph. */
  showLabel?: boolean;
  className?: string;
};

/**
 * One mountain glyph per tier: the peak climbs with the tier, from a low hill at Basecamp to a
 * tall summit. Decorative — the tier name is always available as text.
 */
export function TierBadge({ tier, size = 28, showLabel = false, className }: TierBadgeProps) {
  const { order, label } = getTierInfo(tier);
  const peak = 26 - order * 2.4; // order 1 → 23.6 (low), order 9 → 4.4 (tall)
  const shoulder = 26 - order * 1.1;

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
        <path
          d={`M3 27 L12 ${shoulder.toFixed(1)} L16 ${peak.toFixed(1)} L21 ${(shoulder + 3).toFixed(1)} L29 27 Z`}
          fill="var(--rank)"
          opacity={0.18 + order * 0.09}
          stroke="var(--rank)"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel && <span className="font-display font-extrabold text-rank">{label}</span>}
    </span>
  );
}
