import { Outlet } from 'react-router';
import { LogCard } from '../components/LogCard';
import { RankSummaryCard } from '../components/RankSummaryCard';
import { TierBoardCard } from '../components/TierBoardCard';
import { WeekTracksCard } from '../components/WeekTracksCard';

/**
 * Home answers "what should I do next to climb?". Four cards in a 12-column grid:
 *   row 1: Log activity | Your rank        row 2: This week | Top of the tiers
 * Row 2 stretches (`auto 1fr`) so the grid reaches the bottom of the viewport, and cards in a row
 * are equal height. 1280px+ splits 8/4, 1024–1279px splits 7/5, and below 1024px everything stacks
 * in priority order: Log, Rank, This week, Top of the tiers.
 * `*:h-full` makes each card fill its grid cell whatever state (loading, error, data) it is in.
 */
export default function HomePage() {
  return (
    <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:items-stretch">
      <div className="*:h-full lg:col-span-7 xl:col-span-8">
        <LogCard />
      </div>
      <div className="*:h-full lg:col-span-5 xl:col-span-4">
        <RankSummaryCard />
      </div>
      <div className="*:h-full lg:col-span-7 xl:col-span-8">
        <WeekTracksCard />
      </div>
      <div className="*:h-full lg:col-span-5 xl:col-span-4">
        <TierBoardCard />
      </div>
      {/* /app/log renders the Log Activity sheet here, on top of Home. */}
      <Outlet />
    </div>
  );
}
