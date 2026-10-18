import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function NotificationsPage() {
  return (
    <PlaceholderPage
      title="Notifications"
      screen={11}
      endpoints={[
        'GET /api/notifications',
        'GET /api/notifications/unread-count',
        'POST /api/notifications/{id}/read',
      ]}
    />
  );
}
