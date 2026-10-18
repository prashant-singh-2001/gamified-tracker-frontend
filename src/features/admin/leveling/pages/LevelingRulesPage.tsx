import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function LevelingRulesPage() {
  return (
    <PlaceholderPage
      title="Leveling rules"
      screen={14}
      endpoints={['GET /api/threshold', 'POST /api/threshold']}
    />
  );
}
