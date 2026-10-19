import { Outlet } from 'react-router';
import { LogCard } from '../components/LogCard';
import { RankSummaryCard } from '../components/RankSummaryCard';
import { TierBoardCard } from '../components/TierBoardCard';
import { WeekTracksCard } from '../components/WeekTracksCard';

/**
 * Home answers "what should I do next to climb?". On phones the cards stack in priority order;
 * from 1024px the Log card and week tracks take 8 columns and the two boards stack in the other 4.
 */
export default function HomePage() {
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <div className="lg:col-span-8 lg:row-start-1">
        <LogCard />
      </div>
      <div className="flex flex-col gap-4 lg:col-span-4 lg:col-start-9 lg:row-span-2 lg:row-start-1">
        <RankSummaryCard />
        <TierBoardCard />
      </div>
      <div className="lg:col-span-8 lg:row-start-2">
        <WeekTracksCard />
      </div>
      {/* /app/log renders the Log Activity sheet here, on top of Home. */}
      <Outlet />
    </div>
  );
}
