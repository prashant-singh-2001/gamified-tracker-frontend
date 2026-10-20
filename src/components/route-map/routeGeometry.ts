import { WAYPOINTS } from './contours';

/**
 * Distance along the drawn route at which each tier waypoint sits (Basecamp first). The route is
 * a smooth curve through the waypoints, so the nearest of a few hundred samples is the waypoint.
 */
export function waypointLengths(route: SVGPathElement): number[] {
  const total = route.getTotalLength();
  const steps = 800;
  const samples = Array.from({ length: steps + 1 }, (_, i) => {
    const length = (total * i) / steps;
    const { x, y } = route.getPointAtLength(length);
    return { length, x, y };
  });
  return WAYPOINTS.map(
    (w) =>
      samples.reduce(
        (best, s) => {
          const d = (s.x - w.x) ** 2 + (s.y - w.y) ** 2;
          return d < best.d ? { d, length: s.length } : best;
        },
        { d: Infinity, length: 0 },
      ).length,
  );
}

/** Where on the route a climber sits: `progress` (0–1) of the way from their tier to the next. */
export function routeDistance(lengths: number[], tierOrder: number, progress: number): number {
  const from = lengths[tierOrder - 1] ?? 0;
  const to = lengths[tierOrder] ?? from;
  return from + (to - from) * progress;
}
