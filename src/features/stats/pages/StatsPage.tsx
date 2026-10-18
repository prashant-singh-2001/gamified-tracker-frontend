import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function StatsPage() {
  return (
    <PlaceholderPage
      title="Stats"
      screen={9}
      endpoints={[
        'GET /api/activitylog/analytics/user/{userId}/xp-over-time',
        'GET .../category-summary',
        'GET .../weekly-report',
        'GET .../best-time-of-day',
      ]}
    />
  );
}
