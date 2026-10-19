import { CATEGORY_DEFAULT_MULTIPLIER, type Category } from '@/lib/api/types';

/** `GET /api/activity/` entry (ActivityResponseRecord). The catalog exposes no id. */
export type CatalogActivity = {
  name: string;
  category: Category;
  xpMultiplier: number;
  active: boolean;
  description: string | null;
  createdAt: string;
};

/** The multiplier that actually applies: a positive override, else the category default. */
export function effectiveMultiplier(activity: Pick<CatalogActivity, 'category' | 'xpMultiplier'>) {
  return activity.xpMultiplier > 0
    ? activity.xpMultiplier
    : CATEGORY_DEFAULT_MULTIPLIER[activity.category];
}

/** `GET /api/activitylog/streaks/user/{id}` row (StreakResponse). */
export type Streak = {
  activityId: number;
  currentStreak: number;
  longestStreak: number;
  /** `YYYY-MM-DD` (UTC day) or null if the activity was never logged. */
  lastActivityDate: string | null;
};
