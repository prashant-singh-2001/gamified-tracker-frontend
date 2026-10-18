import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function LogActivityPage() {
  return (
    <PlaceholderPage
      title="Log activity"
      screen={4}
      endpoints={['POST /api/activitylog/natural', 'POST /api/activitylog/', 'GET /api/activity/']}
    />
  );
}
