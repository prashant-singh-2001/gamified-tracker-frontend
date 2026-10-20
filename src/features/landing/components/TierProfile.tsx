import { RANK_TIERS } from '@/lib/api/types';

// The widest tier (Alpine, 25% of climbers) sets the full bar width.
const WIDEST = Math.max(...RANK_TIERS.map((t) => t.topTo - t.topFrom));

/**
 * The nine tiers, Summit on top, each bar as wide as the share of climbers in that tier. Tiers are
 * cut by position, so the stack comes out as the uneven profile of a mountain, not a pyramid.
 */
export function TierProfile() {
  const tiers = [...RANK_TIERS].reverse();
  return (
    <figure className="flex flex-col gap-4">
      <ol className="flex flex-col gap-1.5">
        {tiers.map((tier) => {
          const share = tier.topTo - tier.topFrom;
          const summit = tier.order === RANK_TIERS.length;
          const darkness = ((tier.order - 1) / (RANK_TIERS.length - 1)) * 100;
          return (
            <li
              key={tier.id}
              className="grid grid-cols-[6rem_1fr_5.5rem] items-center gap-3 sm:grid-cols-[8rem_1fr_7rem] sm:gap-4"
            >
              <span className="font-display text-[1.65rem] leading-none font-bold">
                {tier.label}
              </span>
              <span className="flex justify-center">
                <span
                  aria-hidden="true"
                  className="h-7 rounded-[3px]"
                  style={{
                    width: `${(share / WIDEST) * 100}%`,
                    background: summit
                      ? 'var(--accent)'
                      : `color-mix(in srgb, var(--text) ${darkness}%, var(--line-strong))`,
                  }}
                />
              </span>
              <span className="text-right text-[15px] text-muted italic">{tier.band}</span>
            </li>
          );
        })}
      </ol>
      <figcaption className="max-w-[34rem] text-[15px] leading-relaxed text-muted">
        Bar length is the share of all climbers in that tier. Percentages count from the top, so
        Summit is the best 5%.
      </figcaption>
    </figure>
  );
}
