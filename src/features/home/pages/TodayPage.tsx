import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function TodayPage() {
  return (
    <PlaceholderPage
      title="Today"
      screen={3}
      endpoints={[
        'GET /api/ranks/me',
        'GET /api/activitylog/streaks/user/{id}',
        'GET /api/notifications/unread-count',
      ]}
    />
  );
}
