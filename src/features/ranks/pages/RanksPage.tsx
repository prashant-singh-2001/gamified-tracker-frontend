import { RankHeader } from '../components/RankHeader';
import { TierMountain } from '../components/TierMountain';

/** Rank & leaderboards: where you stand, then the mountain. */
export default function RanksPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <RankHeader />
      <TierMountain />
    </div>
  );
}
