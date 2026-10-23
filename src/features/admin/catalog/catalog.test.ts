import { describe, expect, it } from 'vitest';
import type { CatalogActivity } from '@/features/activities/types';
import {
  EMPTY_FORM,
  formFor,
  isDefaultMultiplier,
  isEmptyPatch,
  nameTaken,
  sortCatalog,
  toCreateBody,
  toPatchBody,
} from './catalog';
import { activitySchema } from './schemas';

const activity = (over: Partial<CatalogActivity> = {}): CatalogActivity => ({
  id: 1,
  name: 'Running',
  category: 'HEALTH',
  xpMultiplier: 1.3,
  active: true,
  description: 'Out the door',
  createdAt: '2026-10-01T00:00:00',
  ...over,
});

describe('sortCatalog', () => {
  it('sorts by category in the order the app lists them, then by name', () => {
    const rows = [
      activity({ id: 1, name: 'Chess', category: 'GAMING' }),
      activity({ id: 2, name: 'Writing', category: 'WORK' }),
      activity({ id: 3, name: 'Reading', category: 'STUDY' }),
      activity({ id: 4, name: 'Algebra', category: 'STUDY' }),
      activity({ id: 5, name: 'Yoga', category: 'HEALTH' }),
    ];
    expect(sortCatalog(rows).map((r) => r.name)).toEqual([
      'Algebra',
      'Reading',
      'Writing',
      'Yoga',
      'Chess',
    ]);
  });

  it('does not change the list it was given', () => {
    const rows = [activity({ id: 1, name: 'B' }), activity({ id: 2, name: 'A' })];
    sortCatalog(rows);
    expect(rows.map((r) => r.name)).toEqual(['B', 'A']);
  });
});

describe('nameTaken', () => {
  const rows = [activity({ id: 1, name: 'Running' }), activity({ id: 2, name: 'Deep work' })];

  it('ignores case and surrounding spaces', () => {
    expect(nameTaken(rows, '  running ')).toBe(true);
    expect(nameTaken(rows, 'DEEP WORK')).toBe(true);
    expect(nameTaken(rows, 'Reading')).toBe(false);
  });

  it('lets an activity keep its own name', () => {
    expect(nameTaken(rows, 'Running', 1)).toBe(false);
    expect(nameTaken(rows, 'Running', 2)).toBe(true);
  });

  it('is never taken for a blank name', () => {
    expect(nameTaken(rows, '   ')).toBe(false);
  });
});

describe('the multiplier', () => {
  it('reads as the default when it equals the category default, or is not positive', () => {
    expect(isDefaultMultiplier({ category: 'HEALTH', xpMultiplier: 1.3 })).toBe(true);
    expect(isDefaultMultiplier({ category: 'HEALTH', xpMultiplier: 0 })).toBe(true);
    expect(isDefaultMultiplier({ category: 'HEALTH', xpMultiplier: 1.8 })).toBe(false);
  });

  it('fills the form with a blank multiplier for a default and the number for an override', () => {
    expect(formFor(activity({ xpMultiplier: 1.3 })).multiplier).toBe('');
    expect(formFor(activity({ xpMultiplier: 1.8 })).multiplier).toBe('1.8');
  });
});

describe('formFor', () => {
  it('is empty and active for a new activity', () => {
    expect(formFor()).toEqual(EMPTY_FORM);
    expect(EMPTY_FORM.active).toBe(true);
  });

  it('turns a missing description into an empty field', () => {
    expect(formFor(activity({ description: null })).description).toBe('');
  });
});

describe('toCreateBody', () => {
  it('trims, and leaves the multiplier and description out when blank', () => {
    expect(
      toCreateBody({
        name: '  Reading ',
        category: 'STUDY',
        multiplier: '',
        description: ' ',
        active: true,
      }),
    ).toEqual({ name: 'Reading', category: 'STUDY', active: true });
  });

  it('sends an override and a description when given', () => {
    expect(
      toCreateBody({
        name: 'Deep work',
        category: 'WORK',
        multiplier: '1.8',
        description: 'Focus',
        active: false,
      }),
    ).toEqual({
      name: 'Deep work',
      category: 'WORK',
      xpMultiplier: 1.8,
      description: 'Focus',
      active: false,
    });
  });

  it('does not send a multiplier of zero', () => {
    expect(toCreateBody({ ...EMPTY_FORM, name: 'X', multiplier: '0' })).not.toHaveProperty(
      'xpMultiplier',
    );
  });
});

describe('toPatchBody', () => {
  const original = activity({ xpMultiplier: 1.8, description: 'Out the door' });

  it('is empty when nothing changed', () => {
    expect(isEmptyPatch(toPatchBody(formFor(original), original))).toBe(true);
  });

  it('sends only the fields that changed', () => {
    const values = { ...formFor(original), name: ' Jogging ', active: false };
    expect(toPatchBody(values, original)).toEqual({ name: 'Jogging', active: false });
  });

  it('sends a new multiplier, and zero to clear the override', () => {
    expect(toPatchBody({ ...formFor(original), multiplier: '2' }, original)).toEqual({
      xpMultiplier: 2,
    });
    expect(toPatchBody({ ...formFor(original), multiplier: '' }, original)).toEqual({
      xpMultiplier: 0,
    });
  });

  it('does not send a multiplier for an activity on the default that stays blank', () => {
    const onDefault = activity({ xpMultiplier: 1.3 });
    expect(isEmptyPatch(toPatchBody(formFor(onDefault), onDefault))).toBe(true);
  });

  it('clears the description with an empty string', () => {
    expect(toPatchBody({ ...formFor(original), description: '' }, original)).toEqual({
      description: '',
    });
  });
});

describe('activitySchema', () => {
  const valid = {
    name: 'Reading',
    category: 'STUDY',
    multiplier: '',
    description: '',
    active: true,
  };

  it('accepts a blank multiplier, zero and a positive number', () => {
    for (const multiplier of ['', '0', '1.5', ' 2 ']) {
      expect(activitySchema.safeParse({ ...valid, multiplier }).success).toBe(true);
    }
  });

  it('rejects a blank name, a long name, a negative or non-numeric multiplier', () => {
    expect(activitySchema.safeParse({ ...valid, name: '   ' }).success).toBe(false);
    expect(activitySchema.safeParse({ ...valid, name: 'x'.repeat(256) }).success).toBe(false);
    expect(activitySchema.safeParse({ ...valid, multiplier: '-1' }).success).toBe(false);
    expect(activitySchema.safeParse({ ...valid, multiplier: 'fast' }).success).toBe(false);
  });
});
