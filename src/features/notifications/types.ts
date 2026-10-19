/** `GET /api/notifications/unread-count` — note the capital `C` in the key. */
export type UnreadCount = { Count: number };

/** Row of `GET /api/notifications` (LevelUpEventDto). */
export type LevelUpEvent = {
  id: number;
  activityId: number;
  oldLevel: number;
  newLevel: number;
  totalXp: number;
  currentLevelXp: number;
  read: boolean;
  createdAt: string;
};
