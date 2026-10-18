import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function ReviewQueuePage() {
  return (
    <PlaceholderPage
      title="Review queue"
      screen={12}
      endpoints={[
        'GET /api/activitylog/review/flagged',
        'POST /api/activitylog/review/{id}/approve',
        'POST /api/activitylog/review/{id}/reject',
      ]}
    />
  );
}
