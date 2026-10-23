import { describe, expect, it } from 'vitest';
import type { ActivityLogResponse } from '@/features/log-activity/types';
import { pendingCount } from './api';
import type { Basis, ReviewItem } from './types';
import { ratio, severity, severityShare, whyFlagged } from './verdict';

function item(
  over: Partial<Omit<ReviewItem, 'activityLog'>> & { minutes?: number; status?: string } = {},
): ReviewItem {
  return {
    activityLog: {
      id: 1,
      userId: 5,
      durationMinutes: over.minutes ?? 216,
      reviewStatus: over.status ?? 'FLAGGED',
    } as ActivityLogResponse,
    modifiedZScore: over.modifiedZScore ?? 6.2,
    median: over.median ?? 45,
    sampleSize: over.sampleSize ?? 12,
    basis: over.basis ?? 'MODIFIED_Z_SCORE',
  };
}

describe('ratio', () => {
  it('is how many times the usual duration', () => {
    expect(ratio(item({ minutes: 216, median: 45 }))).toBeCloseTo(4.8);
  });

  it('is null when there is no usual to compare with', () => {
    expect(ratio(item({ median: 0 }))).toBeNull();
  });
});

describe('whyFlagged', () => {
  it('says how many times their usual and how much history it rests on', () => {
    expect(whyFlagged(item())).toEqual({
      headline: '4.8× their usual 45 min',
      detail: 'based on 12 past sessions',
      rough: false,
    });
  });

  it('rounds a big multiple to a whole number', () => {
    expect(whyFlagged(item({ minutes: 600, median: 45 })).headline).toBe('13× their usual 45 min');
  });

  it('says rough estimate for the fallbacks', () => {
    for (const basis of ['MEAN_AD_FALLBACK', 'RELATIVE_FALLBACK'] as Basis[]) {
      expect(whyFlagged(item({ basis, sampleSize: 4 }))).toEqual({
        headline: '4.8× their usual 45 min',
        detail: 'rough estimate from 4 past sessions',
        rough: true,
      });
    }
  });

  it('says few past sessions when there was too little to compare', () => {
    expect(whyFlagged(item({ basis: 'INSUFFICIENT_SAMPLES', sampleSize: 1, median: 0 }))).toEqual({
      headline: 'Very long for one session',
      detail: 'few past sessions, rough estimate',
      rough: true,
    });
  });

  it('names the absolute limit, with their usual when they have one', () => {
    expect(whyFlagged(item({ basis: 'ABSOLUTE_THRESHOLD', sampleSize: 20 }))).toMatchObject({
      headline: 'Over the limit for one session',
      detail: 'their usual is 45 min, from 20 past sessions',
      rough: false,
    });
    expect(
      whyFlagged(item({ basis: 'ABSOLUTE_THRESHOLD', sampleSize: 0, median: 0 })),
    ).toMatchObject({
      detail: 'few past sessions, rough estimate',
      rough: true,
    });
  });

  it('uses the singular for one past session', () => {
    expect(whyFlagged(item({ sampleSize: 1 })).detail).toBe('based on 1 past session');
  });
});

describe('severity', () => {
  it('uses the z-score, or the multiple when there is none', () => {
    expect(severity(item({ modifiedZScore: 6.2 }))).toBe(6.2);
    expect(severity(item({ modifiedZScore: 0, minutes: 90, median: 45 }))).toBe(2);
    expect(severity(item({ modifiedZScore: 0, median: 0 }))).toBe(0);
  });

  it('scales a bar against the worst row, never to nothing', () => {
    const queue = [
      item({ modifiedZScore: 10 }),
      item({ modifiedZScore: 5 }),
      item({ modifiedZScore: 0.1 }),
    ];
    expect(severityShare(queue[0] as ReviewItem, queue)).toBe(1);
    expect(severityShare(queue[1] as ReviewItem, queue)).toBe(0.5);
    expect(severityShare(queue[2] as ReviewItem, queue)).toBe(0.08);
  });

  it('shows a small bar when no row has a severity', () => {
    const queue = [item({ modifiedZScore: 0, median: 0 })];
    expect(severityShare(queue[0] as ReviewItem, queue)).toBe(0.1);
  });
});

describe('pendingCount', () => {
  it('counts only sessions still flagged', () => {
    expect(pendingCount([item(), item({ status: 'APPROVED' }), item({ status: 'REJECTED' })])).toBe(
      1,
    );
    expect(pendingCount(undefined)).toBe(0);
  });
});
