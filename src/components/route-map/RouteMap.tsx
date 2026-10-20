import type { CSSProperties, ReactNode, Ref } from 'react';
import { RANK_TIERS } from '@/lib/api/types';
import { buildContours, smoothPath, WAYPOINTS, type Waypoint } from './contours';
import './survey.css';

const CONTOURS = buildContours();
const ROUTE = smoothPath(WAYPOINTS);

// Each tier marker appears as the line reaches it (by straight-line distance along the route).
const TOTAL_MS = 2800;
const START_MS = 300;
const legs = WAYPOINTS.slice(1).map((p, i) => {
  const from = WAYPOINTS[i] as Waypoint;
  return Math.hypot(p.x - from.x, p.y - from.y);
});
const length = legs.reduce((a, b) => a + b, 0);
const DELAYS = WAYPOINTS.map((_, i) => {
  const along = legs.slice(0, i).reduce((a, b) => a + b, 0);
  return Math.round(START_MS + (along / length) * TOTAL_MS * 0.9);
});

/**
 * The hero: a survey sheet with the nine-tier route drawn across it. The line draws itself once on
 * load and the tier markers appear as it reaches them; with reduced motion it simply is complete.
 */
type RouteMapProps = {
  /** Draw the route and pop the markers in on load. Off, the map is simply complete. */
  animate?: boolean;
  /** The accent route line, for callers that measure it (e.g. to move a marker along it). */
  routeRef?: Ref<SVGPathElement>;
  /** Extra layers drawn on top, in map coordinates. */
  children?: ReactNode;
};

export function RouteMap({ animate = true, routeRef, children }: RouteMapProps) {
  return (
    <svg
      className="route-map size-full overflow-visible"
      data-static={animate ? undefined : true}
      viewBox="0 0 900 760"
      preserveAspectRatio="xMaxYMid meet"
      role="img"
      aria-label="A map with a route climbing through nine ranks, from Basecamp at the bottom left to Summit at the top."
    >
      <g fill="none" stroke="var(--line-strong)" strokeLinejoin="round">
        {CONTOURS.map((c, i) => (
          <path key={i} d={c.d} strokeWidth={c.major ? 1.6 : 0.9} opacity={c.major ? 0.9 : 0.65} />
        ))}
      </g>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path className="route-line" pathLength={1} d={ROUTE} stroke="var(--bg)" strokeWidth={12} />
        <path
          className="route-line"
          ref={routeRef}
          pathLength={1}
          d={ROUTE}
          stroke="var(--accent)"
          strokeWidth={5}
        />
      </g>

      {WAYPOINTS.map((p, i) => {
        const tier = RANK_TIERS[i];
        if (!tier) return null;
        const summit = i === WAYPOINTS.length - 1;
        return (
          <g
            key={tier.id}
            className="route-flag"
            style={{ '--delay': `${DELAYS[i]}ms` } as CSSProperties}
          >
            {summit ? (
              <>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={17}
                  fill="#C8F25A"
                  stroke="var(--text)"
                  strokeWidth={3}
                />
                <path
                  d={`M${p.x - 8} ${p.y + 6}l5-9 4 6 2-3 3 6`}
                  fill="none"
                  stroke="#0D0F14"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            ) : (
              <circle
                cx={p.x}
                cy={p.y}
                r={8}
                fill="var(--surface)"
                stroke="var(--text)"
                strokeWidth={3}
              />
            )}
            <g className="hidden md:block" aria-hidden="true">
              <text
                x={p.x + p.dx}
                y={p.y + p.dy}
                textAnchor={p.anchor}
                className="route-label"
                fill="var(--text)"
                stroke="var(--bg)"
                strokeWidth={7}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {tier.label}
              </text>
            </g>
          </g>
        );
      })}
      {children}
    </svg>
  );
}
