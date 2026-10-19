import { describe, expect, it } from 'vitest';
import { neighboursOf } from './neighbours';
import type { RankTierMember } from './types';

const board = (n: number): RankTierMember[] =>
  Array.from({ length: n }, (_, i) => ({
    withinRankPosition: i + 1,
    userId: 100 + i,
    totalXp: 1000 - i,
    overallLevel: 5,
    tier: 'ALPINE',
  }));

describe('neighboursOf', () => {
  it('returns the user with five people either side', () => {
    const rows = neighboursOf(board(30), 115);
    expect(rows).toHaveLength(11);
    expect(rows?.[5]?.userId).toBe(115);
    expect(rows?.[0]?.withinRankPosition).toBe(11);
  });

  it('clamps at the top of the board', () => {
    const rows = neighboursOf(board(30), 101);
    expect(rows?.map((r) => r.withinRankPosition)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('clamps at the bottom of the board', () => {
    const rows = neighboursOf(board(10), 109);
    expect(rows).toHaveLength(6);
    expect(rows?.at(-1)?.userId).toBe(109);
  });

  it('returns null when the user is not in the loaded rows', () => {
    expect(neighboursOf(board(10), 999)).toBeNull();
  });
});
