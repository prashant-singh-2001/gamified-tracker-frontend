import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { RANK_TIERS } from '@/lib/api/types';
import { useMyRank } from '../api';
import { RankHeader } from '../components/RankHeader';
import { GlobalTab } from '../components/GlobalTab';
import { TierBoardTab } from '../components/TierBoardTab';
import { TierMountain } from '../components/TierMountain';

type TabId = 'mountain' | 'tier' | 'global';

const TABS: readonly TabItem<TabId>[] = [
  { id: 'mountain', label: 'Mountain' },
  { id: 'tier', label: 'Tier board' },
  { id: 'global', label: 'Global' },
];

/**
 * Rank & leaderboards. The URL says which tab is open, so links and refresh work:
 * `/app/ranks` is the mountain, `/app/ranks/RIDGE` is that tier's board, `?tab=global` the overall one.
 */
export default function RanksPage() {
  const { tier: tierParam } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const rank = useMyRank();
  const activity = Number(params.get('activity')) || null;

  const tier = RANK_TIERS.find((t) => t.id === tierParam?.toUpperCase());
  const tab: TabId = tier ? 'tier' : params.get('tab') === 'global' ? 'global' : 'mountain';

  function chooseActivity(id: number | null) {
    void navigate(id === null ? '/app/ranks?tab=global' : `/app/ranks?tab=global&activity=${id}`, {
      replace: true,
    });
  }

  function open(next: TabId) {
    const target =
      next === 'tier'
        ? `/app/ranks/${rank.data?.tier ?? 'BASECAMP'}`
        : next === 'global'
          ? '/app/ranks?tab=global'
          : '/app/ranks';
    void navigate(target, { replace: true });
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <RankHeader />
      <Tabs tabs={TABS} value={tab} onChange={open} label="Rank views">
        {tab === 'mountain' && <TierMountain />}
        {tab === 'tier' && tier && <TierBoardTab tier={tier.id} />}
        {tab === 'global' && <GlobalTab activityId={activity} onActivityChange={chooseActivity} />}
      </Tabs>
    </div>
  );
}
