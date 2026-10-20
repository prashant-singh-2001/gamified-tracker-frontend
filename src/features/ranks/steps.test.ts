import { describe, expect, it } from 'vitest';
import type { RankCard } from '@/lib/api/types';
import {
  climb,
  movementOf,
  nudgeFor,
  rankShift,
  roman,
  roughXp,
  stepLabel,
  topShare,
} from './steps';

const card: RankCard = {
  tier: 'RIDGE',
  division: 2,
  divisionProgress: 0.4,
  overallLevel: 6,
  totalXp: 3851.57,
  percentile: 0.0125,
  position: 3,
  totalUsers: 240,
  updatedAt: '2026-10-20T04:12:01',
  nextDivisionTier: 'RIDGE',
  nextDivision: 1,
  xpToNextDivision: 61.3,
};

describe('names', () => {
  it('writes divisions as roman numerals, I the best', () => {
    expect([1, 2, 3].map((d) => roman(d as 1 | 2 | 3))).toEqual(['I', 'II', 'III']);
    expect(stepLabel('RIDGE', 2)).toBe('Ridge II');
    expect(stepLabel('RIDGE')).toBe('Ridge');
  });

  it('turns the top fraction into a top percentage, never 0', () => {
    expect(topShare(0.0125)).toBe('Top 1%');
    expect(topShare(0)).toBe('Top 1%');
    expect(topShare(0.31)).toBe('Top 31%');
  });
});

describe('climb', () => {
  it('counts three equal divisions, III at the bottom', () => {
    expect(climb({ ...card, division: 3, divisionProgress: 0 })).toBe(0);
    expect(climb({ ...card, division: 2, divisionProgress: 0.4 })).toBeCloseTo((1 + 0.4) / 3);
    expect(climb({ ...card, division: 1, divisionProgress: 1 })).toBe(1);
  });

  it('falls back to the place in the tier band without a division', () => {
    const { division: _d, divisionProgress: _p, ...old } = card;
    void _d;
    void _p;
    // Ridge is the top 15-25%; a top fraction of 0.2 is halfway up it.
    expect(climb({ ...old, percentile: 0.2 })).toBeCloseTo(0.5);
  });
});

describe('the nudge', () => {
  it('rounds so it reads as a nudge, and never goes below zero', () => {
    expect(roughXp(61.3)).toBe(60);
    expect(roughXp(249.3)).toBe(250);
    expect(roughXp(4.2)).toBe(5);
    expect(roughXp(1240)).toBe(1250);
    expect(roughXp(-3)).toBe(0);
  });

  it('names the next step with about this much XP', () => {
    expect(nudgeFor(card)).toEqual({ kind: 'gap', to: 'Ridge I', xp: '60', exact: false });
  });

  it('can point across a tier', () => {
    expect(
      nudgeFor({
        ...card,
        division: 1,
        nextDivisionTier: 'PEAK',
        nextDivision: 3,
        xpToNextDivision: 249.3,
      }),
    ).toEqual({ kind: 'gap', to: 'Peak III', xp: '250', exact: false });
  });

  it('is close when the gap rounds to nothing, and at the top when there is no next step', () => {
    expect(nudgeFor({ ...card, xpToNextDivision: 0 })).toEqual({ kind: 'close', to: 'Ridge I' });
    expect(nudgeFor({ ...card, nextDivision: null, nextDivisionTier: null })).toEqual({
      kind: 'top',
    });
  });

  it('uses the tier fields on a backend without divisions', () => {
    const old: RankCard = {
      tier: 'ALPINE',
      overallLevel: 1,
      totalXp: 1,
      percentile: 0.3,
      position: 1,
      totalUsers: 1,
      updatedAt: '2026-10-20T04:12:01',
      nextTier: 'RIDGE',
      xpToNextTier: 1500.2,
    };
    expect(nudgeFor(old)).toEqual({ kind: 'gap', to: 'Ridge', xp: '1,501', exact: true });
    expect(nudgeFor({ ...old, nextTier: null })).toEqual({ kind: 'top' });
    expect(nudgeFor({ ...old, nextTier: undefined })).toBeNull();
  });
});

describe('movement', () => {
  it('says nothing without a trend', () => {
    expect(movementOf({ tier: 'RIDGE', trend: null })).toBeNull();
    expect(movementOf({ tier: 'RIDGE' })).toBeNull();
  });

  it('leads with the trend and shows places only when they agree', () => {
    expect(
      movementOf({ tier: 'RIDGE', division: 2, trend: 'UP', positionChange: 4 }),
    ).toMatchObject({
      kind: 'up',
      label: 'Up 4 places recently',
      short: '+4',
    });
    expect(movementOf({ tier: 'RIDGE', trend: 'UP', positionChange: 1 })?.label).toBe(
      'Up 1 place recently',
    );
    // UP with no gain, or null, has no number to show.
    expect(movementOf({ tier: 'RIDGE', trend: 'UP', positionChange: -2 })?.label).toBe(
      'Moving up recently',
    );
    expect(movementOf({ tier: 'RIDGE', trend: 'UP', positionChange: null })?.short).toBe('Up');
    // A promotion with fewer places (many people joined) does not show the negative number.
    const promoted = movementOf({
      tier: 'RIDGE',
      division: 1,
      trend: 'PROMOTED',
      positionChange: -12,
    });
    expect(promoted).toMatchObject({
      kind: 'promoted',
      label: 'Promoted to Ridge I',
      short: 'Promoted',
    });
  });

  it('frames setbacks as the climb continuing', () => {
    expect(movementOf({ tier: 'ALPINE', division: 1, trend: 'DEMOTED' })?.label).toBe(
      'Now Alpine I. The climb continues.',
    );
    expect(movementOf({ tier: 'ALPINE', trend: 'DOWN', positionChange: -3 })).toMatchObject({
      kind: 'down',
      label: 'Down 3 places recently. The climb continues.',
      short: '−3',
    });
    expect(movementOf({ tier: 'ALPINE', trend: 'DOWN', positionChange: 2 })?.label).toBe(
      'Eased back recently. The climb continues.',
    );
  });

  it('words new and steady plainly', () => {
    expect(movementOf({ tier: 'BASECAMP', trend: 'NEW' })?.label).toBe('New on the mountain');
    expect(movementOf({ tier: 'BASECAMP', trend: 'SAME' })?.label).toBe('Holding steady');
  });
});

describe('rankShift', () => {
  it('is nothing when nothing changed', () => {
    expect(rankShift(card, { ...card })).toEqual({ kind: 'none' });
    expect(rankShift(card, null)).toEqual({ kind: 'none' });
  });

  it('notices a first rank, a new tier, a new division and places gained', () => {
    expect(rankShift(null, card)).toEqual({ kind: 'joined', to: 'Ridge II' });
    expect(rankShift({ ...card, tier: 'ALPINE', division: 1 }, card)).toEqual({
      kind: 'tier',
      to: 'Ridge II',
    });
    expect(rankShift({ ...card, division: 3 }, card)).toEqual({ kind: 'division', to: 'Ridge II' });
    expect(rankShift({ ...card, position: 9 }, card)).toEqual({ kind: 'places', places: 6 });
  });

  it('does not celebrate a drop', () => {
    expect(rankShift({ ...card, division: 1 }, card)).toEqual({ kind: 'none' });
    expect(rankShift({ ...card, position: 1 }, card)).toEqual({ kind: 'none' });
  });
});
