import { getTierInfo, type Division, type RankTier } from '@/lib/api/types';
import { cn } from '@/lib/utils/cn';

type DivisionStepsProps = {
  tier: RankTier;
  division: Division;
  /** Pixel width of the glyph; the height follows. */
  width?: number;
  className?: string;
};

/**
 * Three stairs inside a tier, III the first and I the top. The steps up to yours are filled in the
 * tier colour, the ones still above you are outlines. Decorative: the roman numeral is the text.
 */
export function DivisionSteps({ tier, division, width = 30, className }: DivisionStepsProps) {
  const { order } = getTierInfo(tier);
  const reached = 4 - division; // III → 1 step, II → 2, I → 3
  return (
    <svg
      width={width}
      height={width * 0.6}
      viewBox="0 0 30 18"
      aria-hidden="true"
      className={cn('shrink-0', className)}
    >
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={i * 10.5}
          y={12 - i * 5.5}
          width={9}
          height={6 + i * 5.5}
          rx={1.5}
          fill={i < reached ? `var(--tier-${order})` : 'none'}
          stroke="var(--text)"
          strokeWidth={1.4}
          strokeOpacity={i < reached ? 1 : 0.45}
          strokeDasharray={i < reached ? undefined : '2 2'}
        />
      ))}
    </svg>
  );
}
