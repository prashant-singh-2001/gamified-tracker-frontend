import { toApiError } from '@/lib/api/errors';

/** Which part of the form a rejected log belongs to. Errors are shown inline, never as toasts. */
export type LogErrorTarget = 'activityName' | 'duration' | 'ended' | 'form';

export type LogError = { target: LogErrorTarget; message: string };

/**
 * Routes a backend rejection of `POST /api/activitylog/` to the field the user can fix.
 * The backend reports these as ProblemDetail `detail` strings, so matching is on its wording:
 *  - "Session duration of N minutes exceeds the maximum allowed M minutes."
 *  - "Logging this N-minute session would bring today's total to …"
 *  - "endTime must be after startTime"
 *  - "start Time should be past or present" / "end Time should be past or present"
 *  - "Activity name is required" and the 409 for an inactive activity
 */
export function mapLogError(err: unknown): LogError {
  const { status, message, problem } = toApiError(err);
  const text = message.toLowerCase();

  // Validation 400s name the offending fields; that beats guessing from the wording.
  const fields = problem?.errors;
  if (status === 400 && typeof fields === 'object' && fields !== null) {
    if ('activityName' in fields) return { target: 'activityName', message };
    if ('startTime' in fields || 'endTime' in fields) {
      return {
        target: 'ended',
        message: 'That time is in the future. Pick a time that has passed.',
      };
    }
  }

  if (text.includes('exceeds the maximum') || text.includes("today's total")) {
    return { target: 'duration', message };
  }
  if (text.includes('must be after')) {
    return { target: 'duration', message: 'The session needs to last at least a minute.' };
  }
  if (/(start|end) ?time/.test(text) && text.includes('past')) {
    return { target: 'ended', message: 'That time is in the future. Pick a time that has passed.' };
  }
  if (text.includes('activity name') || status === 409) {
    return { target: 'activityName', message };
  }
  return { target: 'form', message };
}
