import { Link } from 'react-router';
import { ArrowRight, Flame, Mountain, SquareCheck, Star } from 'lucide-react';
import { buttonClass } from '@/components/ui/buttonStyles';
import { HeroPreview } from '../components/HeroPreview';

const FEATURES = [
  { icon: Star, color: 'text-xp', label: 'XP & levels' },
  { icon: Flame, color: 'text-streak', label: 'Daily streaks' },
  { icon: SquareCheck, color: 'text-accent', label: 'Quests' },
  { icon: Mountain, color: 'text-rank', label: 'Ranks & leaderboard' },
];

export default function LandingPage() {
  return (
    <section className="mx-auto flex w-full max-w-[1240px] flex-wrap-reverse items-center gap-14 px-6 pt-8 pb-16">
      <div className="max-w-[600px] min-w-0 flex-[1_1_460px]">
        <HeroPreview />
      </div>

      <div className="flex min-w-0 flex-[1_1_420px] flex-col items-start gap-6">
        <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 font-mono text-[13px] text-soft">
          <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
          Free &amp; open source
        </p>

        <h1 className="font-display text-[clamp(2.5rem,5vw,4.25rem)] leading-[1.02] font-extrabold tracking-[-0.03em]">
          Turn your daily habits into a game worth winning.
        </h1>

        <p className="max-w-[34rem] text-lg leading-relaxed text-soft">
          Log what you do, earn XP for every activity, level up, keep your streak alive — and climb
          nine ranks from Basecamp to Summit against everyone else.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link to="/register" className={buttonClass('primary', 'lg', 'gap-2.5 font-bold')}>
            Start your first quest
            <ArrowRight className="size-[18px]" strokeWidth={2.5} aria-hidden="true" />
          </Link>
          <Link to="/login" className={buttonClass('secondary', 'lg')}>
            I have an account · Log in
          </Link>
        </div>

        <ul className="mt-2 flex flex-wrap gap-5 text-[15px] text-muted">
          {FEATURES.map(({ icon: Icon, color, label }) => (
            <li key={label} className="flex items-center gap-2">
              <Icon className={`size-[18px] ${color}`} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
