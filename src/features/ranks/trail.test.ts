import { describe, expect, it } from 'vitest';
import { markerPoint, nodePoint, ROW_H, rowOfTier, trailPath } from './trail';

describe('trail geometry', () => {
  it('puts Summit in the top row and Basecamp in the bottom one', () => {
    expect(rowOfTier(9)).toBe(0);
    expect(rowOfTier(1)).toBe(8);
  });

  it('zigzags between two columns, one node per row', () => {
    expect(nodePoint(0).x).not.toBe(nodePoint(1).x);
    expect(nodePoint(0).x).toBe(nodePoint(2).x);
    expect(nodePoint(3).y).toBe(3 * ROW_H + ROW_H / 2);
  });

  it('starts the marker on the tier node and moves it up towards the next tier', () => {
    expect(markerPoint(5, 0)).toEqual(nodePoint(rowOfTier(5)));
    const half = markerPoint(5, 0.5);
    expect(half.y).toBeLessThan(nodePoint(rowOfTier(5)).y);
    expect(half.y).toBeGreaterThan(nodePoint(rowOfTier(6)).y);
    // Even at the very top of the tier it stays inside its own row.
    const top = markerPoint(5, 1);
    expect(top.y).toBeGreaterThan(nodePoint(rowOfTier(5)).y - ROW_H / 2);
    expect(top.y).toBeLessThan(nodePoint(rowOfTier(5)).y);
  });

  it('keeps the marker on the Summit node at the top', () => {
    expect(markerPoint(9, 0.7)).toEqual(nodePoint(0));
  });

  it('clamps progress outside 0-1', () => {
    expect(markerPoint(4, -1)).toEqual(markerPoint(4, 0));
    expect(markerPoint(4, 3)).toEqual(markerPoint(4, 1));
  });

  it('draws one smooth path', () => {
    expect(trailPath().startsWith('M')).toBe(true);
    expect(trailPath()).not.toContain('NaN');
  });
});
