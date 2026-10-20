/** `GET /api/notifications/unread-count`. (The old capital-`C` key has been removed.) */
export type UnreadCount = { count: number };

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
