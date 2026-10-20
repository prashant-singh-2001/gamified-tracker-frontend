export type Point = { x: number; y: number };
export type Contour = { d: string; major: boolean };

/** Where the contour lines converge, in the 900×760 map space. */
export const SUMMIT: Point = { x: 650, y: 225 };

const f = (n: number) => n.toFixed(1);

/** Array read for indices known to be in range (the project forbids unchecked index access). */
const at = (p: readonly Point[], i: number): Point => p[i] as Point;

/** Smooth closed curve through the points (Catmull-Rom converted to cubic Béziers). */
function closedPath(p: Point[]): string {
  const n = p.length;
  let d = `M${f(at(p, 0).x)} ${f(at(p, 0).y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(p, (i - 1 + n) % n);
    const p1 = at(p, i);
    const p2 = at(p, (i + 1) % n);
    const p3 = at(p, (i + 2) % n);
    d += `C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return `${d}Z`;
}

/** Smooth open curve through the points; used for the route. */
export function smoothPath(p: readonly Point[]): string {
  let d = `M${f(at(p, 0).x)} ${f(at(p, 0).y)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = at(p, Math.max(0, i - 1));
    const p1 = at(p, i);
    const p2 = at(p, i + 1);
    const p3 = at(p, Math.min(p.length - 1, i + 2));
    d += `C${f(p1.x + (p2.x - p0.x) / 6)} ${f(p1.y + (p2.y - p0.y) / 6)} ${f(p2.x - (p3.x - p1.x) / 6)} ${f(p2.y - (p3.y - p1.y) / 6)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

const RING_COUNT = 26;
const STEPS = 96;

/**
 * Concentric, wobbling rings around the summit: tight on the north-east face, spread out on the
 * south-west slope where the route starts. Deterministic, so the map is the same on every load.
 * Every fifth ring is an index contour, drawn heavier.
 */
export function buildContours(): Contour[] {
  const rings: Contour[] = [];
  for (let i = 1; i <= RING_COUNT; i++) {
    const r = 28 * i;
    const cx = SUMMIT.x - i * 6;
    const cy = SUMMIT.y + i * 3.5;
    const points: Point[] = [];
    for (let k = 0; k < STEPS; k++) {
      const t = (k / STEPS) * Math.PI * 2;
      const wobble =
        1 +
        0.15 * Math.sin(2 * t + 0.6) +
        0.08 * Math.sin(3 * t + 1.9) +
        0.045 * Math.sin(5 * t + 0.3) +
        0.025 * Math.sin(7 * t + 2.2);
      const slope = 1 + 0.25 * Math.cos(t - (Math.PI * 3) / 4);
      points.push({
        x: cx + r * 1.3 * wobble * slope * Math.cos(t),
        y: cy + r * 0.9 * wobble * slope * Math.sin(t),
      });
    }
    rings.push({ d: closedPath(points), major: i % 5 === 0 });
  }
  return rings;
}
