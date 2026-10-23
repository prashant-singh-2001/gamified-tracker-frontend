import type { LevelTracker } from '@/features/activities/types';

/** The most XP one manual award may give; the backend rejects anything over it. */
export const AWARD_CAP = 10_000;

/** Highest XP first, so the climbers who matter to a rank question are at the top. */
export const byTotalXp = (rows: readonly LevelTracker[]) =>
  [...rows].sort((a, b) => b.totalXp - a.totalXp || a.userId - b.userId);

/**
 * Keeps the trackers whose user id contains what was typed. Only ids exist (the backend has no way
 * to look users up), so "42" finds user 42, 142 and 420; "#42" works the same.
 */
export function searchTrackers(rows: readonly LevelTracker[], search: string): LevelTracker[] {
  const wanted = search
    .trim()
    .replace(/^#/, '')
    .replace(/^user\s*/i, '');
  if (wanted === '') return [...rows];
  return rows.filter((r) => String(r.userId).includes(wanted));
}

export type AwardInput = { user: string; activityId: number | null; xp: string };
export type AwardErrors = Partial<Record<'user' | 'activityId' | 'xp', string>>;

/** The award form's checks, mirroring the backend: a whole-number user, an activity, 0 to 10,000 XP. */
export function awardErrors(input: AwardInput): AwardErrors {
  const errors: AwardErrors = {};
  const user = input.user.trim();
  if (user !== '' && (!/^\d+$/.test(user) || Number(user) < 1)) {
    errors.user = 'Enter a user number, like 4012, or leave it blank to award yourself';
  }
  if (input.activityId === null) errors.activityId = 'Choose an activity';
  const xp = input.xp.trim() === '' ? NaN : Number(input.xp);
  if (!Number.isFinite(xp)) errors.xp = 'Enter how much XP to award';
  else if (xp < 0) errors.xp = 'XP cannot be negative';
  else if (xp > AWARD_CAP) errors.xp = `At most ${AWARD_CAP.toLocaleString('en-US')} XP per award`;
  return errors;
}

export const hasErrors = (errors: AwardErrors) => Object.keys(errors).length > 0;
