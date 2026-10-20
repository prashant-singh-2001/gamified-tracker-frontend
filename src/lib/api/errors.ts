import axios from 'axios';
import type { ProblemDetail } from './types';

/** Normalised error thrown by every API hook. */
export class ApiError extends Error {
  readonly status: number | null;
  readonly problem: ProblemDetail | null;

  constructor(message: string, status: number | null, problem: ProblemDetail | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.problem = problem;
  }
}

function isProblemDetail(data: unknown): data is ProblemDetail {
  return typeof data === 'object' && data !== null;
}

const FALLBACK_BY_STATUS: Record<number, string> = {
  400: 'Some of the information you entered is not valid.',
  401: 'Your session has expired. Please log in again.',
  403: "You don't have permission to do that.",
  404: "We couldn't find what you were looking for.",
  409: 'That action conflicts with the current state. Refresh and try again.',
  429: 'Too many requests. Please wait a moment and try again.',
};

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return new ApiError(
        "Can't reach the server. Check your connection and try again.",
        null,
        null,
      );
    }
    const { status, data } = err.response;
    const problem = isProblemDetail(data) ? data : null;
    const message =
      problem?.detail?.trim() ||
      FALLBACK_BY_STATUS[status] ||
      (status >= 500 ? 'Something went wrong on our side. Please try again.' : 'Request failed.');
    return new ApiError(message, status, problem);
  }

  return new ApiError(err instanceof Error ? err.message : 'Something went wrong.', null, null);
}

export function getErrorMessage(err: unknown): string {
  return toApiError(err).message;
}

/**
 * Per-field messages from a validation `400` (`errors` extension member: field → message),
 * limited to the `known` field names so an unexpected key never swallows the form-level message.
 * Null when there is nothing a field can show.
 */
export function fieldErrors(err: unknown, known: readonly string[]): Record<string, string> | null {
  const { status, problem } = toApiError(err);
  const raw = problem?.errors;
  if (status !== 400 || typeof raw !== 'object' || raw === null) return null;
  const picked: Record<string, string> = {};
  for (const [field, message] of Object.entries(raw)) {
    if (known.includes(field) && typeof message === 'string') picked[field] = message;
  }
  return Object.keys(picked).length > 0 ? picked : null;
}

export function isNotFound(err: unknown): boolean {
  return toApiError(err).status === 404;
}

/** One ranked "did you mean" entry from a 404 on POST /api/activitylog/. */
export type ActivitySuggestion = {
  name: string;
  category: string;
  active: boolean;
  score: number;
  matchedOn: string;
};

/**
 * The backend answers an unmatched activity name with a 404 ProblemDetail carrying
 * `requestedName` and `suggestions` extension members. Returns null for any other error.
 */
export function getActivitySuggestions(
  err: unknown,
): { requestedName: string; suggestions: ActivitySuggestion[] } | null {
  const { status, problem } = toApiError(err);
  if (status !== 404 || !problem) return null;
  const { requestedName, suggestions } = problem;
  if (typeof requestedName !== 'string' || !Array.isArray(suggestions)) return null;
  return { requestedName, suggestions: suggestions as ActivitySuggestion[] };
}
