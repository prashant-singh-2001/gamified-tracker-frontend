const NODES = [
  [60, 640],
  [230, 600],
  [400, 556],
  [570, 508],
  [740, 452],
  [910, 392],
  [1080, 326],
  [1250, 254],
  [1380, 190],
] as const;

const TRAIL = NODES.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');

/** The hero's rank trail, Basecamp to Summit, drawn faintly behind the auth card. */
export function RankTrailBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <svg
        className="size-full opacity-50"
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="auth-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="var(--line)" />
          </pattern>
          <linearGradient id="auth-fade" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="1" stopColor="var(--line-strong)" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <rect width="1440" height="720" fill="url(#auth-dots)" />
        <path
          d={TRAIL}
          fill="none"
          stroke="url(#auth-fade)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {NODES.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="6"
            fill={i < 4 ? 'var(--accent)' : 'var(--line-strong)'}
          />
        ))}
        <path d="M1396 176l16-28 16 28z" fill="var(--line-strong)" />
      </svg>
    </div>
  );
}
