import type { ActivityLogResponse } from '@/features/log-activity/types';

/** How the duration detector reached its verdict, from `DurationOutlierDetector.Basis`. */
export type Basis =
  | 'INSUFFICIENT_SAMPLES'
  | 'MODIFIED_Z_SCORE'
  | 'MEAN_AD_FALLBACK'
  | 'RELATIVE_FALLBACK'
  | 'ABSOLUTE_THRESHOLD';

/** One row of `GET /api/activitylog/review/flagged` (ReviewQueueItemResponse). */
export type ReviewItem = {
  activityLog: ActivityLogResponse;
  /** How far the session sits from the user's norm; 0 when the detector had too little to go on. */
  modifiedZScore: number;
  /** The user's usual duration for this activity, in minutes. */
  median: number;
  /** How many past sessions the median is based on. */
  sampleSize: number;
  basis: Basis;
};

export type Decision = 'approve' | 'reject';
