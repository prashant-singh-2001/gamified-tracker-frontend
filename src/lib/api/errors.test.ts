import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { getActivitySuggestions, getErrorMessage, isNotFound } from './errors';

function axiosError(status: number, data: unknown) {
  return new AxiosError('failed', 'ERR', undefined, undefined, {
    status,
    data,
  } as AxiosResponse);
}

describe('error mapping', () => {
  it('prefers the ProblemDetail detail', () => {
    expect(getErrorMessage(axiosError(409, { detail: 'Already reviewed' }))).toBe(
      'Already reviewed',
    );
  });

  it('falls back to a friendly message per status', () => {
    expect(getErrorMessage(axiosError(403, {}))).toMatch(/permission/i);
    expect(getErrorMessage(axiosError(503, ''))).toMatch(/our side/i);
  });

  it('explains network failures', () => {
    expect(getErrorMessage(new AxiosError('Network Error'))).toMatch(/reach the server/i);
  });

  it('detects 404s', () => {
    expect(isNotFound(axiosError(404, { detail: 'No rank yet' }))).toBe(true);
    expect(isNotFound(axiosError(500, {}))).toBe(false);
  });

  it('extracts "did you mean" suggestions from an unresolved-activity 404', () => {
    const suggestion = {
      name: 'Running',
      category: 'FITNESS',
      active: true,
      score: 0.9,
      matchedOn: 'NAME',
    };
    const err = axiosError(404, {
      detail: 'Activity not found: runing',
      requestedName: 'runing',
      suggestions: [suggestion],
    });
    expect(getActivitySuggestions(err)).toEqual({
      requestedName: 'runing',
      suggestions: [suggestion],
    });
  });

  it('does not treat other errors as suggestions', () => {
    expect(getActivitySuggestions(axiosError(404, { detail: 'Not found' }))).toBeNull();
    expect(getActivitySuggestions(axiosError(500, { suggestions: [] }))).toBeNull();
  });
});
