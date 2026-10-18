import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function TierLeaderboardPage() {
  return (
    <PlaceholderPage
      title="Tier leaderboard"
      screen={8}
      endpoints={['GET /api/ranks/{tier}/leaderboard']}
    />
  );
}
