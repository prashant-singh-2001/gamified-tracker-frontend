import { describe, expect, it } from 'vitest';
import { nextTierUp, tierProgress } from './tierProgress';

describe('tierProgress', () => {
  // Alpine is the top 25-50%; `percentile` is a top fraction where 0 is the best user.
  it('is full at the upper edge of the band (about to be promoted)', () => {
    expect(tierProgress({ tier: 'ALPINE', percentile: 0.25 })).toBe(1);
  });

  it('is empty at the lower edge of the band', () => {
    expect(tierProgress({ tier: 'ALPINE', percentile: 0.5 })).toBe(0);
  });

  it('moves linearly between the edges', () => {
    expect(tierProgress({ tier: 'ALPINE', percentile: 0.375 })).toBeCloseTo(0.5);
    expect(tierProgress({ tier: 'ALPINE', percentile: 0.4 })).toBeCloseTo(0.4);
  });

  it('clamps values outside the band', () => {
    expect(tierProgress({ tier: 'ALPINE', percentile: 0 })).toBe(1);
    expect(tierProgress({ tier: 'ALPINE', percentile: 0.9 })).toBe(0);
  });

  it('works for the narrow top and bottom tiers', () => {
    expect(tierProgress({ tier: 'SUMMIT', percentile: 0 })).toBe(1);
    // Basecamp is the bottom 5% (0.95-1); 0.99 is 80% of the way down it, so 20% of the way up.
    expect(tierProgress({ tier: 'BASECAMP', percentile: 0.99 })).toBeCloseTo(0.2);
  });
});

describe('nextTierUp', () => {
  it('returns the tier above, and null at the top', () => {
    expect(nextTierUp('ALPINE')?.id).toBe('RIDGE');
    expect(nextTierUp('BASECAMP')?.id).toBe('TRAILHEAD');
    expect(nextTierUp('SUMMIT')).toBeNull();
  });
});
