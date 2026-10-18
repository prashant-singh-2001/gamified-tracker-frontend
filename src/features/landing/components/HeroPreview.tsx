import './hero.css';

const MONO = { fontFamily: 'var(--font-mono)' } as const;
const SANS = { fontFamily: 'var(--font-body)' } as const;

/**
 * Animated product preview: quests get checked off, XP floats up, the level bar fills,
 * a level badge pulses and the rank marker climbs from Alpine to Ridge on the tier ladder.
 */
export function HeroPreview() {
  return (
    <svg
      className="hero-trailer hero-anim block h-auto w-full"
      viewBox="0 0 560 630"
      role="img"
      aria-label="Animated preview: daily quests get checked off, XP floats up, the level bar fills, a level badge pulses and the rank marker climbs from Alpine to Ridge on a nine-tier ladder from Basecamp to Summit."
    >
      <defs>
        <pattern id="hero-dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.2" fill="#252B37" />
        </pattern>
      </defs>
      <rect
        x="0.5"
        y="0.5"
        width="559"
        height="629"
        rx="28"
        fill="var(--surface)"
        stroke="var(--line)"
      />
      <rect x="0.5" y="0.5" width="559" height="629" rx="28" fill="url(#hero-dots)" />

      <text
        x="36"
        y="54"
        {...MONO}
        fontSize="13"
        fontWeight="700"
        fill="var(--text-muted)"
        letterSpacing="1.5"
      >
        TODAY'S QUESTS
      </text>
      <text x="524" y="54" textAnchor="end" {...MONO} fontSize="13" fill="var(--text-muted)">
        2 / 3 done
      </text>

      {/* Quest 1 */}
      <g>
        <rect
          x="32"
          y="76"
          width="496"
          height="72"
          rx="16"
          fill="var(--surface-2)"
          stroke="var(--line)"
        />
        <circle cx="72" cy="112" r="14" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <path
          className="chk chk1"
          d="M65 112l5 5 10-11"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="102" y="107" {...SANS} fontSize="18" fontWeight="700" fill="var(--text)">
          Morning run
        </text>
        <text x="102" y="130" {...SANS} fontSize="13" fill="var(--text-muted)">
          5 km · Fitness
        </text>
        <rect x="428" y="97" width="80" height="30" rx="15" fill="#2A2416" />
        <text
          x="468"
          y="117"
          textAnchor="middle"
          {...MONO}
          fontSize="13"
          fontWeight="700"
          fill="var(--xp)"
        >
          +40 XP
        </text>
        <text
          className="flt flt1"
          x="468"
          y="88"
          textAnchor="middle"
          {...MONO}
          fontSize="16"
          fontWeight="700"
          fill="var(--xp)"
        >
          +40
        </text>
      </g>

      {/* Quest 2 */}
      <g>
        <rect
          x="32"
          y="164"
          width="496"
          height="72"
          rx="16"
          fill="var(--surface-2)"
          stroke="var(--line)"
        />
        <circle cx="72" cy="200" r="14" fill="none" stroke="var(--accent)" strokeWidth="2.5" />
        <path
          className="chk chk2"
          d="M65 200l5 5 10-11"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="102" y="195" {...SANS} fontSize="18" fontWeight="700" fill="var(--text)">
          Read 20 pages
        </text>
        <text x="102" y="218" {...SANS} fontSize="13" fill="var(--text-muted)">
          Learning
        </text>
        <rect x="428" y="185" width="80" height="30" rx="15" fill="#2A2416" />
        <text
          x="468"
          y="205"
          textAnchor="middle"
          {...MONO}
          fontSize="13"
          fontWeight="700"
          fill="var(--xp)"
        >
          +25 XP
        </text>
        <text
          className="flt flt2"
          x="468"
          y="176"
          textAnchor="middle"
          {...MONO}
          fontSize="16"
          fontWeight="700"
          fill="var(--xp)"
        >
          +25
        </text>
      </g>

      {/* Quest 3 (up next) */}
      <g className="card3">
        <rect
          x="32"
          y="252"
          width="496"
          height="72"
          rx="16"
          fill="#171B23"
          stroke="var(--line)"
          strokeDasharray="5 5"
        />
        <circle cx="72" cy="288" r="14" fill="none" stroke="#3A4252" strokeWidth="2.5" />
        <text x="102" y="283" {...SANS} fontSize="18" fontWeight="700" fill="var(--text-soft)">
          Deep work · 90 min
        </text>
        <text x="102" y="306" {...SANS} fontSize="13" fill="var(--text-faint)">
          Focus · up next
        </text>
        <text
          x="468"
          y="293"
          textAnchor="middle"
          {...MONO}
          fontSize="13"
          fontWeight="700"
          fill="var(--text-faint)"
        >
          +60 XP
        </text>
      </g>

      {/* Level */}
      <text
        x="36"
        y="370"
        {...MONO}
        fontSize="13"
        fontWeight="700"
        fill="var(--text)"
        letterSpacing="1.5"
      >
        LEVEL 7
      </text>
      <text x="524" y="370" textAnchor="end" {...MONO} fontSize="13" fill="var(--text-muted)">
        toward level 8
      </text>
      <rect x="32" y="384" width="496" height="14" rx="7" fill="var(--line)" />
      <rect className="xpfill" x="32" y="384" width="496" height="14" rx="7" fill="var(--accent)" />

      {/* Streak + level-up badge */}
      <g>
        <path
          d="M52 456c-9-6-11-17-3-27 1 6 4 8 7 9-1-9 3-16 10-21-1 9 4 13 7 18 4 7 2 17-6 21"
          fill="var(--streak)"
        />
        <path
          d="M60 456c-4-3-5-8-1-13 1 3 3 4 5 4 0-4 2-7 5-9 0 4 2 6 3 9 1 4 0 7-4 9"
          fill="var(--xp)"
        />
        <text x="92" y="446" {...SANS} fontSize="17" fontWeight="700" fill="var(--text)">
          Streak alive
        </text>
        <text x="92" y="466" {...SANS} fontSize="13" fill="var(--text-muted)">
          Don't break the chain
        </text>
      </g>
      <g className="badge">
        <rect
          x="404"
          y="428"
          width="124"
          height="44"
          rx="22"
          fill="#1F2A12"
          stroke="var(--accent)"
          strokeWidth="1.5"
        />
        <path
          d="M430 438l3.5 7 7.5 1-5.5 5.2 1.4 7.6-6.9-3.7-6.9 3.7 1.4-7.6-5.5-5.2 7.5-1z"
          fill="var(--accent)"
        />
        <text x="450" y="456" {...MONO} fontSize="13" fontWeight="700" fill="var(--accent)">
          LVL UP
        </text>
      </g>

      {/* Rank ladder */}
      <line x1="32" y1="490" x2="528" y2="490" stroke="var(--line)" />
      <text
        x="36"
        y="516"
        {...MONO}
        fontSize="13"
        fontWeight="700"
        fill="var(--text)"
        letterSpacing="1.5"
      >
        RANK
      </text>
      <text
        className="rk1"
        x="524"
        y="516"
        textAnchor="end"
        {...MONO}
        fontSize="13"
        fontWeight="700"
        fill="var(--text-muted)"
      >
        ALPINE · top 50%
      </text>
      <text
        className="rk2"
        x="524"
        y="516"
        textAnchor="end"
        {...MONO}
        fontSize="13"
        fontWeight="700"
        fill="var(--accent)"
      >
        RIDGE · top 25%
      </text>
      <path
        d="M48 584L106 578L164 572L222 566L280 560L338 554L396 548L454 542L512 536"
        fill="none"
        stroke="var(--line-strong)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48 584L106 578L164 572L222 566L280 560L338 554"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        className="seg"
        d="M338 554L396 548"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="48" cy="584" r="4" fill="var(--accent)" />
      <circle cx="106" cy="578" r="4" fill="var(--accent)" />
      <circle cx="164" cy="572" r="4" fill="var(--accent)" />
      <circle cx="222" cy="566" r="4" fill="var(--accent)" />
      <circle cx="280" cy="560" r="4" fill="var(--accent)" />
      <circle cx="338" cy="554" r="4" fill="var(--accent)" />
      <circle cx="396" cy="548" r="4" fill="#3A4252" />
      <circle cx="454" cy="542" r="4" fill="#3A4252" />
      <path d="M504 538l8-14 8 14z" fill="#3A4252" />
      <g className="rankmk">
        <circle
          cx="338"
          cy="554"
          r="11"
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="2.5"
        />
        <circle cx="338" cy="554" r="5" fill="var(--accent)" />
      </g>
      <text x="40" y="608" {...SANS} fontSize="12" fill="var(--text-faint)">
        Basecamp
      </text>
      <text x="524" y="608" textAnchor="end" {...SANS} fontSize="12" fill="var(--text-faint)">
        Summit
      </text>
    </svg>
  );
}
