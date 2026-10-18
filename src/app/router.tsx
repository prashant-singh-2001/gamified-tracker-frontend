import { createBrowserRouter, Navigate, type RouteObject } from 'react-router';
import { Skeleton } from '@/components/ui/Skeleton';
import { RedirectIfAuthed } from '@/lib/auth/RedirectIfAuthed';
import { RequireAuth } from '@/lib/auth/RequireAuth';
import { RequireRole } from '@/lib/auth/RequireRole';
import { loginUrl } from '@/lib/auth/redirect';
import { setSessionExpiredHandler } from '@/lib/auth/session';
import AppLayout from './layouts/AppLayout';
import PublicLayout from './layouts/PublicLayout';
import RouteErrorPage from './pages/RouteErrorPage';

/** Route-level code splitting: each page (and the whole admin shell) is its own chunk. */
const page = (load: () => Promise<{ default: React.ComponentType }>) => ({
  lazy: async () => ({ Component: (await load()).default }),
});

const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: (
      <div role="status" aria-label="Loading" className="p-6">
        <Skeleton className="h-8 w-48" />
      </div>
    ),
    children: [
      {
        element: <PublicLayout />,
        children: [
          {
            element: <RedirectIfAuthed />,
            children: [
              { path: '/', ...page(() => import('@/features/landing/pages/LandingPage')) },
            ],
          },
          { path: '/login', ...page(() => import('@/features/auth/pages/LoginPage')) },
          { path: '/register', ...page(() => import('@/features/auth/pages/RegisterPage')) },
        ],
      },
      {
        path: '/app',
        element: (
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, ...page(() => import('@/features/home/pages/TodayPage')) },
          { path: 'log', ...page(() => import('@/features/log-activity/pages/LogActivityPage')) },
          {
            path: 'log/result/:logId',
            ...page(() => import('@/features/log-activity/pages/LogResultPage')),
          },
          { path: 'history', ...page(() => import('@/features/history/pages/HistoryPage')) },
          {
            path: 'history/:logId',
            ...page(() => import('@/features/history/pages/LogDetailPage')),
          },
          {
            path: 'activities/:activityId',
            ...page(() => import('@/features/activities/pages/ActivityDetailPage')),
          },
          { path: 'ranks', ...page(() => import('@/features/ranks/pages/RanksPage')) },
          {
            path: 'ranks/:tier',
            ...page(() => import('@/features/ranks/pages/TierLeaderboardPage')),
          },
          { path: 'stats', ...page(() => import('@/features/stats/pages/StatsPage')) },
          { path: 'coach', ...page(() => import('@/features/coach/pages/WeeklyCoachPage')) },
          {
            path: 'notifications',
            ...page(() => import('@/features/notifications/pages/NotificationsPage')),
          },
        ],
      },
      {
        path: '/admin',
        element: <RequireRole role="ADMIN" />,
        children: [
          {
            // The admin shell is lazy too, so regular users never download it.
            lazy: async () => ({ Component: (await import('./layouts/AdminLayout')).default }),
            children: [
              { index: true, element: <Navigate to="review" replace /> },
              {
                path: 'review',
                ...page(() => import('@/features/admin/review/pages/ReviewQueuePage')),
              },
              {
                path: 'catalog',
                ...page(() => import('@/features/admin/catalog/pages/ActivityCatalogPage')),
              },
              {
                path: 'leveling',
                ...page(() => import('@/features/admin/leveling/pages/LevelingRulesPage')),
              },
              {
                path: 'system',
                ...page(() => import('@/features/admin/system/pages/SystemToolsPage')),
              },
            ],
          },
        ],
      },
      {
        element: <PublicLayout />,
        children: [{ path: '*', ...page(() => import('./pages/NotFoundPage')) }],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);

// When a refresh fails mid-session, send the user to /login and bring them back afterwards.
setSessionExpiredHandler(() => {
  const { pathname, search } = window.location;
  if (pathname === '/login' || pathname === '/register') return;
  void router.navigate(loginUrl(pathname + search), { replace: true });
});
