import { describe, expect, it } from 'vitest';
import { ladderWindow, levelProgress } from './levels';
import type { Threshold } from './types';

const ladder: Threshold[] = [
  { activityId: 1, level: 1, xpRequired: 0 },
  { activityId: 1, level: 2, xpRequired: 100 },
  { activityId: 1, level: 3, xpRequired: 300 },
  { activityId: 1, level: 4, xpRequired: 600 },
];

describe('levelProgress', () => {
  it('measures through the current level against the ladder', () => {
    // Level 2 starts at 100 XP and level 3 needs 300: 150 total is a quarter of the way.
    expect(levelProgress({ level: 2, totalXp: 150, currentLevelXp: 50 }, ladder)).toEqual({
      level: 2,
      inLevel: 50,
      bandSize: 200,
      toNext: 150,
      percent: 25,
      nextLevel: 3,
    });
  });

  it('is the full bar with nothing to go at the top of the ladder', () => {
    const top = levelProgress({ level: 4, totalXp: 700, currentLevelXp: 100 }, ladder);
    expect(top).toMatchObject({
      level: 4,
      percent: 100,
      toNext: 0,
      nextLevel: null,
      bandSize: null,
    });
  });

  it('ignores the tracker progress fields that cannot see the default curve', () => {
    // The backend reports 0 to go and 100% on the default curve whatever the level.
    const tracker = {
      level: 3,
      totalXp: 450,
      currentLevelXp: 150,
      xpForNextLevel: 0,
      progressPercent: 100,
    };
    expect(levelProgress(tracker, ladder).percent).toBe(50);
    expect(levelProgress(tracker, ladder).toNext).toBe(150);
  });

  it('works back from the tracker when the ladder has no row for the current level', () => {
    const progress = levelProgress({ level: 3, totalXp: 450, currentLevelXp: 150 }, [
      { activityId: 1, level: 4, xpRequired: 600 },
    ]);
    expect(progress).toMatchObject({ inLevel: 150, bandSize: 300, toNext: 150, percent: 50 });
  });

  it('is level 1 at 0% with no tracker yet', () => {
    expect(levelProgress(undefined, ladder)).toMatchObject({
      level: 1,
      inLevel: 0,
      percent: 0,
      toNext: 100,
      nextLevel: 2,
    });
  });

  it('never goes past 100% or below 0', () => {
    expect(levelProgress({ level: 2, totalXp: 999, currentLevelXp: 0 }, ladder).percent).toBe(100);
    expect(levelProgress({ level: 2, totalXp: 50, currentLevelXp: 0 }, ladder).percent).toBe(0);
  });
});

describe('ladderWindow', () => {
  const long: Threshold[] = Array.from({ length: 12 }, (_, i) => ({
    activityId: 1,
    level: i + 1,
    xpRequired: i * 100,
  }));

  it('shows two levels behind, the current one and the next five, marked', () => {
    const rows = ladderWindow(long, 5);
    expect(rows.map((r) => r.level)).toEqual([3, 4, 5, 6, 7, 8, 9, 10]);
    expect(rows.map((r) => r.state)).toEqual([
      'past',
      'past',
      'current',
      'next',
      'next',
      'next',
      'next',
      'next',
    ]);
  });

  it('starts at level 1 for a new climber', () => {
    expect(ladderWindow(long, 1).map((r) => r.level)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('copes with an unsorted ladder', () => {
    expect(ladderWindow([...long].reverse(), 1)[0]?.level).toBe(1);
  });
});
