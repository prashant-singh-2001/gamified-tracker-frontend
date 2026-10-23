import { formatDuration } from '@/lib/utils/format';
import type { ReviewItem } from './types';

/** This session's length over the user's usual one, or null when there is no usual to compare. */
export function ratio(item: ReviewItem): number | null {
  return item.median > 0 ? item.activityLog.durationMinutes / item.median : null;
}

export type Why = {
  /** "4.8× their usual 45 min", the evidence an admin reads first. */
  headline: string;
  /** "based on 12 past sessions", or a plain warning that the estimate is rough. */
  detail: string;
  /** True when the comparison rests on little history, so the admin should weigh it lightly. */
  rough: boolean;
};

const sessions = (n: number) => `${n} past ${n === 1 ? 'session' : 'sessions'}`;

/** Why a session was flagged, in words an admin can act on. */
export function whyFlagged(item: ReviewItem): Why {
  const r = ratio(item);
  const usual = formatDuration(item.median);
  const times = r === null ? null : `${r >= 10 ? Math.round(r) : r.toFixed(1)}×`;

  switch (item.basis) {
    case 'MODIFIED_Z_SCORE':
      return {
        headline: times ? `${times} their usual ${usual}` : 'Far longer than their usual',
        detail: `based on ${sessions(item.sampleSize)}`,
        rough: false,
      };
    case 'MEAN_AD_FALLBACK':
    case 'RELATIVE_FALLBACK':
      return {
        headline: times ? `${times} their usual ${usual}` : 'Longer than their usual',
        detail: `rough estimate from ${sessions(item.sampleSize)}`,
        rough: true,
      };
    case 'INSUFFICIENT_SAMPLES':
      return {
        headline: 'Very long for one session',
        detail: 'few past sessions, rough estimate',
        rough: true,
      };
    case 'ABSOLUTE_THRESHOLD':
      return {
        headline: 'Over the limit for one session',
        detail:
          item.sampleSize > 0
            ? `their usual is ${usual}, from ${sessions(item.sampleSize)}`
            : 'few past sessions, rough estimate',
        rough: item.sampleSize < 5,
      };
  }
}

/** One number to rank rows by: the z-score where there is one, else how many times usual. */
export function severity(item: ReviewItem): number {
  if (item.modifiedZScore > 0) return item.modifiedZScore;
  return ratio(item) ?? 0;
}

/** 0-1 for a severity bar, scaled against the worst row in the queue (never an empty bar). */
export function severityShare(item: ReviewItem, queue: readonly ReviewItem[]): number {
  const worst = Math.max(0, ...queue.map(severity));
  if (worst <= 0) return 0.1;
  return Math.min(1, Math.max(0.08, severity(item) / worst));
}
