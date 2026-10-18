/**
 * Every gateway path in one place. Auth endpoints are NOT prefixed; everything else lives
 * under /api. Path params are plain numbers/strings, never sent as headers.
 */
const API = '/api';

export const endpoints = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
  },
  activities: {
    list: `${API}/activity/`,
    create: `${API}/activity/`,
  },
  activityLog: {
    create: `${API}/activitylog/`,
    natural: `${API}/activitylog/natural`,
    byUser: (userId: number) => `${API}/activitylog/user/${userId}`,
    byId: (logId: number | string) => `${API}/activitylog/${logId}`,
    streaks: (userId: number) => `${API}/activitylog/streaks/user/${userId}`,
    flagged: `${API}/activitylog/review/flagged`,
    approve: (logId: number | string) => `${API}/activitylog/review/${logId}/approve`,
    reject: (logId: number | string) => `${API}/activitylog/review/${logId}/reject`,
    analytics: {
      xpOverTime: (userId: number) => `${API}/activitylog/analytics/user/${userId}/xp-over-time`,
      categorySummary: (userId: number) =>
        `${API}/activitylog/analytics/user/${userId}/category-summary`,
      weeklyReport: (userId: number) => `${API}/activitylog/analytics/user/${userId}/weekly-report`,
      bestTimeOfDay: (userId: number) =>
        `${API}/activitylog/analytics/user/${userId}/best-time-of-day`,
    },
  },
  levels: {
    all: `${API}/level`,
    byUser: (userId: number) => `${API}/level/user/${userId}`,
    byActivity: (activityId: number | string) => `${API}/level/activity/${activityId}`,
  },
  thresholds: {
    all: `${API}/threshold`,
    byActivity: (activityId: number | string) => `${API}/threshold/activity/${activityId}`,
  },
  ranks: {
    all: `${API}/ranks`,
    me: `${API}/ranks/me`,
    myLeaderboard: `${API}/ranks/me/leaderboard`,
    tierLeaderboard: (tier: string) => `${API}/ranks/${tier}/leaderboard`,
    recompute: `${API}/ranks/recompute`,
  },
  leaderboard: {
    global: `${API}/leaderboard`,
    byActivity: (activityId: number | string) => `${API}/leaderboard/activity/${activityId}`,
    me: `${API}/leaderboard/me`,
  },
  insights: {
    weekly: `${API}/insights/weekly`,
  },
  notifications: {
    list: `${API}/notifications`,
    unreadCount: `${API}/notifications/unread-count`,
    markRead: (id: number | string) => `${API}/notifications/${id}/read`,
  },
} as const;
