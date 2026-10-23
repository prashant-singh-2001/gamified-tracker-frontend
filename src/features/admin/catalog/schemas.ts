import { z } from 'zod';

/** Mirrors the backend: a non-blank name (max 255), a category, and a multiplier of 0 or more. */
export const activitySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255, 'Keep the name under 255 characters'),
  category: z.enum(['STUDY', 'WORK', 'HEALTH', 'CHORES', 'GAMING', 'OTHER']),
  multiplier: z
    .string()
    .trim()
    .refine((v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= 0), {
      message: 'Enter a number, or leave it blank for the category default',
    }),
  description: z.string(),
  active: z.boolean(),
});

export const ACTIVITY_FIELDS = [
  'name',
  'category',
  'xpMultiplier',
  'description',
  'active',
] as const;
