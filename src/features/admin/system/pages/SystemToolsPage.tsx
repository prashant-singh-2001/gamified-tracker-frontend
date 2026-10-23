import { AdminPageHeader } from '../../components/AdminPageHeader';
import { AwardCard } from '../components/AwardCard';
import { RecomputeCard } from '../components/RecomputeCard';
import { TrackersCard } from '../components/TrackersCard';

/** Maintenance actions, each a card that says plainly what it does. */
export default function SystemToolsPage() {
  return (
    <div>
      <AdminPageHeader
        title="System tools"
        description="Maintenance actions. Each one says what it changes."
      />
      <div className="flex max-w-4xl flex-col gap-6">
        <RecomputeCard />
        <TrackersCard />
        <AwardCard />
      </div>
    </div>
  );
}
