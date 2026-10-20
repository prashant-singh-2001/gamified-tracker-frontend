import { describe, expect, it } from 'vitest';
import { routeDistance } from './routeGeometry';

const lengths = [0, 100, 250, 400, 560, 700, 820, 930, 1000];

describe('routeDistance', () => {
  it('sits on the tier waypoint at the bottom of the band', () => {
    expect(routeDistance(lengths, 3, 0)).toBe(250);
  });

  it('moves towards the next tier with progress', () => {
    expect(routeDistance(lengths, 3, 0.5)).toBe(325);
    expect(routeDistance(lengths, 3, 1)).toBe(400);
  });

  it('stays on Summit at the top tier whatever the progress', () => {
    expect(routeDistance(lengths, 9, 1)).toBe(1000);
    expect(routeDistance(lengths, 9, 0)).toBe(1000);
  });
});
