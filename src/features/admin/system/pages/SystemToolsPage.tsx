import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function SystemToolsPage() {
  return (
    <PlaceholderPage
      title="System tools"
      screen={15}
      endpoints={[
        'POST /api/ranks/recompute',
        'GET /api/level',
        'GET /api/level/activity/{activityId}',
      ]}
    />
  );
}
