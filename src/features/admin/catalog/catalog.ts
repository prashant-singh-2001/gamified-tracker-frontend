import type { CatalogActivity } from '@/features/activities/types';
import { CATEGORIES, CATEGORY_DEFAULT_MULTIPLIER, type Category } from '@/lib/api/types';

/** The form's values: everything a string or boolean, as the fields hold them. */
export type ActivityFormValues = {
  name: string;
  category: Category;
  /** Blank means "use the category's default". */
  multiplier: string;
  description: string;
  active: boolean;
};

/** `POST /api/activity` body. A missing `xpMultiplier` means the category default. */
export type CreateActivityBody = {
  name: string;
  category: Category;
  xpMultiplier?: number;
  description?: string;
  active: boolean;
};

/** `PATCH /api/activity/{id}` body: only what changed. `xpMultiplier: 0` clears the override. */
export type PatchActivityBody = Partial<{
  name: string;
  category: Category;
  xpMultiplier: number;
  description: string;
  active: boolean;
}>;

/** `DELETE /api/activity/{id}`: removed if nothing referenced it, otherwise only deactivated. */
export type RemoveResult = { id: number; name: string; result: 'REMOVED' | 'DEACTIVATED' };

export const EMPTY_FORM: ActivityFormValues = {
  name: '',
  category: 'STUDY',
  multiplier: '',
  description: '',
  active: true,
};

/** By category (in the order the app lists them), then name. */
export function sortCatalog(rows: readonly CatalogActivity[]): CatalogActivity[] {
  return [...rows].sort(
    (a, b) =>
      CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) ||
      a.name.localeCompare(b.name),
  );
}

/** Whether another activity already has this name (names are unique, ignoring case and spaces). */
export function nameTaken(
  rows: readonly CatalogActivity[],
  name: string,
  exceptId?: number,
): boolean {
  const wanted = name.trim().toLowerCase();
  return (
    wanted !== '' && rows.some((r) => r.id !== exceptId && r.name.trim().toLowerCase() === wanted)
  );
}

/**
 * The API reports the multiplier that applies, so an override that equals the category default
 * cannot be told from no override. Equal to the default reads as "default" (a blank field).
 */
export function isDefaultMultiplier(a: Pick<CatalogActivity, 'category' | 'xpMultiplier'>) {
  return a.xpMultiplier <= 0 || a.xpMultiplier === CATEGORY_DEFAULT_MULTIPLIER[a.category];
}

/** The form for an activity (editing) or an empty one (new). */
export function formFor(activity?: CatalogActivity): ActivityFormValues {
  if (!activity) return EMPTY_FORM;
  return {
    name: activity.name,
    category: activity.category,
    multiplier: isDefaultMultiplier(activity) ? '' : String(activity.xpMultiplier),
    description: activity.description ?? '',
    active: activity.active,
  };
}

/** A blank field is "no override"; anything else is the number typed. */
export const parseMultiplier = (value: string): number | null =>
  value.trim() === '' ? null : Number(value);

export function toCreateBody(values: ActivityFormValues): CreateActivityBody {
  const multiplier = parseMultiplier(values.multiplier);
  const description = values.description.trim();
  return {
    name: values.name.trim(),
    category: values.category,
    ...(multiplier !== null && multiplier > 0 ? { xpMultiplier: multiplier } : {}),
    ...(description ? { description } : {}),
    active: values.active,
  };
}

/** Only the fields that differ from `original`, so an edit never overwrites what it did not touch. */
export function toPatchBody(
  values: ActivityFormValues,
  original: CatalogActivity,
): PatchActivityBody {
  const was = formFor(original);
  const body: PatchActivityBody = {};
  if (values.name.trim() !== was.name) body.name = values.name.trim();
  if (values.category !== was.category) body.category = values.category;
  if (values.description.trim() !== was.description) body.description = values.description.trim();
  if (values.active !== was.active) body.active = values.active;

  const next = parseMultiplier(values.multiplier);
  const before = parseMultiplier(was.multiplier);
  if (next !== before) body.xpMultiplier = next ?? 0; // blank clears the override
  return body;
}

export const isEmptyPatch = (body: PatchActivityBody) => Object.keys(body).length === 0;
