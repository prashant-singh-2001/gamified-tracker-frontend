/** Central TanStack Query key factory. Always build keys here, never inline. */
export const qk = {
  users: {
    me: () => ['users', 'me'] as const,
  },
  ranks: {
    all: ['ranks'] as const,
    me: () => ['ranks', 'me'] as const,
    ladder: () => ['ranks', 'ladder'] as const,
    myBoard: () => ['ranks', 'myBoard'] as const,
    tier: (tier: string, size: number) => ['ranks', 'tier', tier, size] as const,
    tierPages: (tier: string) => ['ranks', 'tierPages', tier] as const,
  },
  leaderboard: {
    /** One board, paged: all activities (`null`) or one activity. */
    global: (activityId: number | null) => ['leaderboard', 'global', activityId] as const,
    activity: (activityId: number | string) => ['leaderboard', 'activity', activityId] as const,
    me: () => ['leaderboard', 'me'] as const,
  },
  activities: {
    all: ['activities'] as const,
    list: () => ['activities', 'list'] as const,
    admin: () => ['activities', 'admin'] as const,
    byId: (id: number) => ['activities', 'byId', id] as const,
  },
  activityLog: {
    /** Prefixes, for invalidating every user's/streak list at once without touching `byId`. */
    allByUser: () => ['activityLog', 'user'] as const,
    allStreaks: () => ['activityLog', 'streaks'] as const,
    byUser: (userId: number) => ['activityLog', 'user', userId] as const,
    pages: (userId: number, filters: object) =>
      ['activityLog', 'user', userId, 'pages', filters] as const,
    recent: (userId: number, limit: number) =>
      ['activityLog', 'user', userId, 'recent', limit] as const,
    byId: (logId: number | string) => ['activityLog', logId] as const,
    streaks: (userId: number) => ['activityLog', 'streaks', userId] as const,
    flagged: () => ['activityLog', 'flagged'] as const,
    outcome: (logId: number) => ['activityLog', 'outcome', logId] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    xpOverTime: (userId: number, days: number) =>
      ['analytics', 'xpOverTime', userId, days] as const,
    categorySummary: (userId: number) => ['analytics', 'categorySummary', userId] as const,
    weeklyReport: (userId: number) => ['analytics', 'weeklyReport', userId] as const,
    bestTimeOfDay: (userId: number) => ['analytics', 'bestTimeOfDay', userId] as const,
  },
  levels: {
    allPrefix: ['levels'] as const,
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
    all: ['notifications'] as const,
    list: (unreadOnly: boolean) => ['notifications', 'list', unreadOnly] as const,
    unreadCount: () => ['notifications', 'unreadCount'] as const,
  },
} as const;
