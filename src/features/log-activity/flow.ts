import { fromServerDateTime } from '@/lib/utils/serverTime';
import type { LogFormValues } from './schemas';
import { minutesBetween, rangeFor, resolveEnd, toDateTimeLocal } from './timing';
import type { ActivityLogRequest, ActivityNameResolution } from './types';

/** What the confirm card shows and, on "Log it", what gets saved. */
export type ConfirmValue = {
  activityName: string;
  start: Date;
  end: Date;
  notes: string;
  /** The backend's restatement of a typed sentence; null when the form was used. */
  interpretation: string | null;
  /** Preview of a fuzzy name match, so the user sees "logs as Running" before saving. */
  nameResolution: ActivityNameResolution | null;
};

export const EMPTY_FORM: LogFormValues = {
  activityName: '',
  durationMinutes: 30,
  ended: 'now',
  endedCustom: '',
  notes: '',
};

export function minutesOf(value: Pick<ConfirmValue, 'start' | 'end'>): number {
  return minutesBetween(value.start, value.end);
}

/** Form → confirm card. Validation has already guaranteed the end time resolves. */
export function confirmFromForm(values: LogFormValues, now: Date = new Date()): ConfirmValue {
  const end = resolveEnd(values.ended, values.endedCustom, now) ?? now;
  const { start } = rangeFor(end, values.durationMinutes);
  return {
    activityName: values.activityName.trim(),
    start,
    end,
    notes: values.notes.trim(),
    interpretation: null,
    nameResolution: null,
  };
}

/** Natural-language draft (UTC wall-clock strings) → confirm card. */
export function confirmFromDraft(
  draft: ActivityLogRequest,
  interpretation: string | null,
  nameResolution: ActivityNameResolution | null,
): ConfirmValue {
  return {
    activityName: draft.activityName,
    start: fromServerDateTime(draft.startTime),
    end: fromServerDateTime(draft.endTime),
    notes: draft.notes ?? '',
    interpretation,
    nameResolution,
  };
}

/** Confirm card → form, for "Edit": the exact end time is kept as a custom time. */
export function formFromConfirm(value: ConfirmValue): LogFormValues {
  return {
    activityName: value.activityName,
    durationMinutes: Math.max(1, minutesOf(value)),
    ended: 'custom',
    endedCustom: toDateTimeLocal(value.end),
    notes: value.notes,
  };
}
