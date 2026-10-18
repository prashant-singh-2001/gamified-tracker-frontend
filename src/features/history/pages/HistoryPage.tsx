import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function HistoryPage() {
  return (
    <PlaceholderPage title="History" screen={6} endpoints={['GET /api/activitylog/user/{id}']} />
  );
}
