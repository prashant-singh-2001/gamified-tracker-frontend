import { Link } from 'react-router';

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M9 20l5-9 4 6 2-3 3 6"
        fill="none"
        stroke="var(--accent-ink)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ to = '/' }: { to?: string }) {
  return (
    <Link to={to} className="flex min-h-11 items-center gap-2.5 text-text no-underline">
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-tight">Etram</span>
    </Link>
  );
}
