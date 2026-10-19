/** Central TanStack Query key factory. Always build keys here, never inline. */
export const qk = {
  ranks: {
    all: ['ranks'] as const,
    me: () => ['ranks', 'me'] as const,
    ladder: () => ['ranks', 'ladder'] as const,
    myBoard: () => ['ranks', 'myBoard'] as const,
    tier: (tier: string, size: number) => ['ranks', 'tier', tier, size] as const,
  },
  leaderboard: {
    global: () => ['leaderboard', 'global'] as const,
    activity: (activityId: number | string) => ['leaderboard', 'activity', activityId] as const,
    me: () => ['leaderboard', 'me'] as const,
  },
  activities: {
    list: () => ['activities', 'list'] as const,
  },
  activityLog: {
    byUser: (userId: number) => ['activityLog', 'user', userId] as const,
    byId: (logId: number | string) => ['activityLog', logId] as const,
    streaks: (userId: number) => ['activityLog', 'streaks', userId] as const,
    flagged: () => ['activityLog', 'flagged'] as const,
  },
  analytics: {
    xpOverTime: (userId: number) => ['analytics', 'xpOverTime', userId] as const,
    categorySummary: (userId: number) => ['analytics', 'categorySummary', userId] as const,
    weeklyReport: (userId: number) => ['analytics', 'weeklyReport', userId] as const,
    bestTimeOfDay: (userId: number) => ['analytics', 'bestTimeOfDay', userId] as const,
  },
  levels: {
    all: () => ['levels', 'all'] as const,
    byUser: (userId: number) => ['levels', 'user', userId] as const,
    byActivity: (activityId: number | string) => ['levels', 'activity', activityId] as const,
  },
  thresholds: {
    all: () => ['thresholds', 'all'] as const,
    byActivity: (activityId: number | string) => ['thresholds', 'activity', activityId] as const,
  },
  insights: {
    weekly: () => ['insights', 'weekly'] as const,
  },
  notifications: {
    list: () => ['notifications', 'list'] as const,
    unreadCount: () => ['notifications', 'unreadCount'] as const,
  },
} as const;
