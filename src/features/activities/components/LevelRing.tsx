const SIZE = 168;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type LevelRingProps = {
  level: number;
  /** 0-100 through the current level. */
  percent: number;
  /** Where the ring is heading, for the accessible description. */
  nextLevel: number | null;
};

/** The level in the middle of a ring that fills as the next level gets closer. */
export function LevelRing({ level, percent, nextLevel }: LevelRingProps) {
  const filled = Math.min(100, Math.max(0, percent));
  return (
    <div
      role="img"
      aria-label={
        nextLevel
          ? `Level ${level}, ${Math.round(filled)}% of the way to level ${nextLevel}`
          : `Level ${level}, the top of the ladder`
      }
      className="relative grid shrink-0 place-items-center"
      style={{ width: SIZE, height: SIZE }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--line)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - filled / 100)}
          className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
        />
      </svg>
      <span aria-hidden="true" className="absolute flex flex-col items-center leading-none">
        <span className="text-sm text-muted">Level</span>
        <span className="font-display text-7xl font-extrabold">{level}</span>
      </span>
    </div>
  );
}
