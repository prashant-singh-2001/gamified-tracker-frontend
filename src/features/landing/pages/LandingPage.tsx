import { Link } from 'react-router';
import { buttonClass } from '@/components/ui/buttonStyles';
import { RouteMap } from '../components/RouteMap';
import { TierProfile } from '../components/TierProfile';
import { XpFacts } from '../components/XpFacts';

const SECTION = 'mx-auto w-full max-w-[1240px] px-6';
const H2 =
  'font-display text-[clamp(2.5rem,5vw,3.75rem)] leading-[0.95] font-extrabold text-balance';

export default function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden xl:flex xl:min-h-[41rem] xl:items-center">
        <div className={`${SECTION} relative z-10 pt-6 pb-4 xl:py-16`}>
          <div className="flex max-w-[34rem] flex-col items-start gap-7">
            <h1 className="font-display text-[clamp(3.5rem,9vw,6.5rem)] leading-[0.88] font-extrabold text-balance">
              <span className="block">Log what you do.</span>{' '}
              <span className="block">Climb from Basecamp to Summit.</span>
            </h1>

            <p className="max-w-[27rem] text-xl leading-relaxed text-soft">
              Etram turns everyday activity into XP. Log a run, a study session or a chore, level
              up, keep your streak, and see where you stand among every other climber.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/register" className={buttonClass('primary', 'lg', 'rounded-full px-8')}>
                Start at Basecamp
              </Link>
              <Link to="/login" className={buttonClass('secondary', 'lg', 'rounded-full px-8')}>
                Log in
              </Link>
            </div>

            <p className="text-[15px] text-muted">Free and open source.</p>
          </div>
        </div>

        <div className="map-fade relative mt-6 h-[22rem] sm:h-[28rem] xl:absolute xl:inset-y-0 xl:right-0 xl:mt-0 xl:h-auto xl:w-[64%]">
          <RouteMap />
        </div>
      </section>

      <section className={`${SECTION} py-20 lg:py-28`}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-20">
          <div className="flex flex-col gap-5">
            <h2 className={H2}>Nine ranks, set by how you compare</h2>
            <p className="text-lg leading-relaxed text-soft">
              Your tier comes from your place among all climbers, not from a fixed score. Ranks
              refresh every few minutes, so a good week shows up quickly.
            </p>
          </div>
          <TierProfile />
        </div>
      </section>

      <section className={`${SECTION} pb-20 lg:pb-28`}>
        <div className="flex flex-col gap-10">
          <h2 className={`${H2} max-w-[34rem]`}>What a session is worth</h2>
          <XpFacts />
        </div>
      </section>

      <section className="bg-text text-bg">
        <div
          className={`${SECTION} flex flex-col items-start gap-6 py-16 sm:flex-row sm:items-center sm:justify-between lg:py-20`}
        >
          <h2 className="font-display text-[clamp(2.75rem,6vw,4.5rem)] leading-[0.9] font-extrabold">
            Basecamp is open.
          </h2>
          <Link to="/register" className={buttonClass('primary', 'lg', 'rounded-full px-8')}>
            Start at Basecamp
          </Link>
        </div>
      </section>
    </>
  );
}
