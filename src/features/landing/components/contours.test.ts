import { describe, expect, it } from 'vitest';
import { buildContours, smoothPath } from './contours';

describe('buildContours', () => {
  const rings = buildContours();

  it('draws closed rings, every fifth one as a heavier index contour', () => {
    expect(rings).toHaveLength(26);
    expect(rings.every((r) => r.d.startsWith('M') && r.d.endsWith('Z'))).toBe(true);
    expect(rings.filter((r) => r.major)).toHaveLength(5);
    expect(rings[4]?.major).toBe(true);
    expect(rings[0]?.major).toBe(false);
  });

  it('is the same map on every load', () => {
    expect(buildContours()).toEqual(rings);
  });

  it('never produces NaN coordinates', () => {
    expect(rings.some((r) => r.d.includes('NaN'))).toBe(false);
  });
});

describe('smoothPath', () => {
  it('starts at the first point and ends at the last', () => {
    const d = smoothPath([
      { x: 0, y: 0 },
      { x: 50, y: 40 },
      { x: 100, y: 10 },
    ]);
    expect(d.startsWith('M0.0 0.0C')).toBe(true);
    expect(d.endsWith('100.0 10.0')).toBe(true);
  });
});
