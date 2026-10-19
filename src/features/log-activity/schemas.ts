import { z } from 'zod';
import { isFuture, MAX_DURATION, MIN_DURATION, parseDateTimeLocal } from './timing';

export const logFormSchema = z
  .object({
    activityName: z.string().trim().min(1, 'Choose or type an activity'),
    durationMinutes: z
      .number({ error: 'Enter how long it took' })
      .int('Use whole minutes')
      .min(MIN_DURATION, 'The session needs to last at least a minute')
      .max(MAX_DURATION, 'A session can be at most 24 hours (1440 minutes)'),
    ended: z.enum(['now', 'hourAgo', 'morning', 'custom']),
    endedCustom: z.string(),
    notes: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.ended !== 'custom') return;
    const end = parseDateTimeLocal(value.endedCustom);
    if (!end) {
      ctx.addIssue({ code: 'custom', path: ['endedCustom'], message: 'Pick when it ended' });
    } else if (isFuture(end)) {
      ctx.addIssue({
        code: 'custom',
        path: ['endedCustom'],
        message: 'That time is in the future. Pick a time that has passed.',
      });
    }
  });

export type LogFormValues = z.infer<typeof logFormSchema>;
