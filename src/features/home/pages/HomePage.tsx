import { Outlet } from 'react-router';
import { AroundYouCard } from '../components/AroundYouCard';
import { LogCard } from '../components/LogCard';
import { RankHero } from '../components/RankHero';
import { TierBoardCard } from '../components/TierBoardCard';
import { WeekTracksCard } from '../components/WeekTracksCard';

/**
 * Home answers "what should I do next to climb?". The first row pairs the Log card with the hero,
 * your place on the nine-tier route; the second holds this week, the climbers around you and the
 * top of the tiers. From 1280px the rows split 5/7 and 4/4/4; from 1024px the last two share a
 * row; below that everything stacks in priority order: Log, route, this week, around you, tiers.
 * `*:h-full` makes each panel fill its grid cell whatever state it is in.
 */
export default function HomePage() {
  return (
    <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch xl:grid-rows-[auto_1fr]">
      <div className="*:h-full lg:col-span-12 xl:col-span-5">
        <LogCard />
      </div>
      <div className="*:h-full lg:col-span-12 xl:col-span-7">
        <RankHero />
      </div>
      <div className="*:h-full lg:col-span-12 xl:col-span-4">
        <WeekTracksCard />
      </div>
      <div className="*:h-full lg:col-span-6 xl:col-span-4">
        <AroundYouCard />
      </div>
      <div className="*:h-full lg:col-span-6 xl:col-span-4">
        <TierBoardCard />
      </div>
      {/* /app/log renders the Log Activity sheet here, on top of Home. */}
      <Outlet />
    </div>
  );
}
