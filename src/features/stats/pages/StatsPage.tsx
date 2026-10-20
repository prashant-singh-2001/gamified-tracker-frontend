import { TrendCard } from '../components/TrendCard';
import { WeekCard } from '../components/WeekCard';

/**
 * Four questions about your climb, each answered by one number and one chart. Two columns from
 * 1024px, one column below in the same order.
 */
export default function StatsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[clamp(3.5rem,7vw,6rem)] leading-[0.88] font-extrabold">
          Stats
        </h1>
        <p className="text-lg text-soft">Your climb in numbers.</p>
      </header>
      <div className="grid grid-cols-1 gap-6 *:min-w-0 lg:grid-cols-2">
        <WeekCard />
        <TrendCard />
      </div>
    </div>
  );
}
