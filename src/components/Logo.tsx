import { Link } from 'react-router';

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="8.5"
        fill="var(--logo-bg, var(--accent))"
        stroke="var(--logo-ring, none)"
      />
      <path
        d="M9 20l5-9 4 6 2-3 3 6"
        fill="none"
        stroke="var(--logo-ink, var(--accent-ink))"
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
      <span className="logo-word font-display text-xl font-extrabold tracking-tight">Etram</span>
    </Link>
  );
}
