import { PlaceholderPage } from '@/components/ui/PlaceholderPage';

export default function RanksPage() {
  return (
    <PlaceholderPage
      title="Rank & leaderboards"
      screen={8}
      endpoints={[
        'GET /api/ranks/me',
        'GET /api/ranks/me/leaderboard',
        'GET /api/ranks',
        'GET /api/leaderboard',
        'GET /api/leaderboard/activity/{activityId}',
        'GET /api/leaderboard/me',
      ]}
    />
  );
}
