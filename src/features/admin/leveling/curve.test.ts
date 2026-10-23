import { describe, expect, it } from 'vitest';
import type { Threshold } from '@/features/activities/types';
import { byLevel, checkLevel, explicitRows, withLevel, withSteps } from './curve';

const t = (level: number, xpRequired: number, activityId = 1): Threshold => ({
  activityId,
  level,
  xpRequired,
});
const ladder = [t(1, 0), t(2, 100), t(3, 300), t(5, 900)];

describe('checkLevel', () => {
  it('accepts a level that sits between its neighbours', () => {
    expect(checkLevel(ladder, 4, 500)).toBeNull();
    expect(checkLevel(ladder, 6, 1200)).toBeNull();
  });

  it('must need more than the nearest lower level, with the server wording', () => {
    expect(checkLevel(ladder, 2, 0)).toBe('XP required must be more than 0');
    expect(checkLevel(ladder, 4, 300)).toBe(
      'Level 4 must need more XP than level 3 (300), but got 300',
    );
    expect(checkLevel(ladder, 4, 250)).toBe(
      'Level 4 must need more XP than level 3 (300), but got 250',
    );
  });

  it('must need less than the nearest higher level', () => {
    expect(checkLevel(ladder, 4, 900)).toBe(
      'Level 4 must need less XP than level 5 (900), but got 900',
    );
    expect(checkLevel(ladder, 4, 1000)).toBe(
      'Level 4 must need less XP than level 5 (900), but got 1,000',
    );
  });

  it('ignores the row being replaced, so an edit can move within its neighbours', () => {
    expect(checkLevel(ladder, 3, 150)).toBeNull();
    expect(checkLevel(ladder, 3, 100)).toBe(
      'Level 3 must need more XP than level 2 (100), but got 100',
    );
    expect(checkLevel(ladder, 3, 950)).toBe(
      'Level 3 must need less XP than level 5 (900), but got 950',
    );
  });

  it('lets a gap in level numbers stand', () => {
    expect(checkLevel([t(1, 0), t(5, 900)], 3, 400)).toBeNull();
  });

  it('rejects numbers that are not levels or XP', () => {
    expect(checkLevel(ladder, 0, 100)).toMatch(/whole number/);
    expect(checkLevel(ladder, 2.5, 100)).toMatch(/whole number/);
    expect(checkLevel(ladder, 4, -5)).toMatch(/0 or more/);
    expect(checkLevel(ladder, 4, Number.NaN)).toMatch(/0 or more/);
  });

  it('lets level 1 start at zero', () => {
    expect(checkLevel([], 1, 0)).toBeNull();
    expect(checkLevel([t(2, 100)], 1, 0)).toBeNull();
  });
});

describe('withSteps', () => {
  it('shows what each level costs on its own', () => {
    expect(withSteps(ladder).map((r) => r.step)).toEqual([null, 100, 200, 600]);
  });

  it('sorts first', () => {
    expect(withSteps([t(3, 300), t(1, 0), t(2, 100)]).map((r) => r.level)).toEqual([1, 2, 3]);
  });
});

describe('explicitRows and withLevel', () => {
  it('takes one activity out of every threshold, in level order', () => {
    const all = [t(2, 100, 1), t(1, 0, 2), t(1, 0, 1), t(3, 50, 2)];
    expect(explicitRows(all, 1).map((r) => r.level)).toEqual([1, 2]);
    expect(explicitRows(all, 9)).toEqual([]);
  });

  it('puts a level into the ladder, replacing one with the same number', () => {
    expect(withLevel(ladder, 4, 500).map((r) => r.level)).toEqual([1, 2, 3, 4, 5]);
    const replaced = withLevel(ladder, 3, 250);
    expect(replaced.find((r) => r.level === 3)?.xpRequired).toBe(250);
    expect(replaced).toHaveLength(4);
  });

  it('does not change the ladder it was given', () => {
    withLevel(ladder, 4, 500);
    expect(ladder).toHaveLength(4);
    expect(byLevel(ladder)[0]?.level).toBe(1);
  });
});
