import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function ActivityCatalogPage() {
  return (
    <PlaceholderPage
      title="Activity catalog"
      screen={13}
      endpoints={['GET /api/activity', 'POST /api/activity']}
    />
  );
}
