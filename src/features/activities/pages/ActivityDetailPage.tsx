import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function ActivityDetailPage() {
  return (
    <PlaceholderPage
      title="Activity detail"
      screen={7}
      endpoints={['GET /api/level/user/{userId}', 'GET /api/threshold/activity/{activityId}']}
    />
  );
}
