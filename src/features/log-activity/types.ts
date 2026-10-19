import type { ActivitySuggestion } from '@/lib/api/errors';
import type { Category } from '@/lib/api/types';

export type ReviewStatus = 'CLEARED' | 'FLAGGED' | 'APPROVED' | 'REJECTED';

/** The `Activity` entity embedded in an ActivityLogResponse (this one does carry an id). */
export type LoggedActivity = {
  id: number;
  name: string;
  category: Category;
  xpMultiplier: number;
  active: boolean;
  description: string | null;
  createdAt: string;
};

/** Body of `POST /api/activitylog/`. Times are UTC wall-clock strings (see serverTime.ts). */
export type ActivityLogRequest = {
  activityName: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
  createdAt?: string | null;
};

/** Present only when the typed name was fuzzy-resolved onto a different catalog entry. */
export type ActivityNameResolution = {
  requestedName: string;
  resolvedName: string;
  score: number;
};

/** Response of `POST /api/activitylog/` and `GET /api/activitylog/{id}`. */
export type ActivityLogResponse = {
  id: number;
  userId: number;
  activity: LoggedActivity;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  xpEarned: number;
  notes: string | null;
  createdAt: string;
  bonusApplied: boolean;
  bonusMultiplier: number;
  leveledUp: boolean;
  currentStreak: number;
  streakMultiplier: number;
  reviewStatus: ReviewStatus;
  nameResolution: ActivityNameResolution | null;
};

export type DraftStatus = 'PARSED' | 'NEEDS_CLARIFICATION' | 'DISABLED' | 'UNAVAILABLE';

export type NaturalLogRequest = { text: string };

/** Response of `POST /api/activitylog/natural`. A preview only — nothing is saved. */
export type NaturalLogDraftResponse = {
  draft: ActivityLogRequest | null;
  interpretation: string | null;
  status: DraftStatus;
  nameResolution: ActivityNameResolution | null;
  suggestions: ActivitySuggestion[] | null;
};
