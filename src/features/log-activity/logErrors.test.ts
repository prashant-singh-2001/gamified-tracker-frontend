import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it } from 'vitest';
import { mapLogError } from './logErrors';

const rejected = (status: number, detail: string) =>
  new AxiosError('failed', 'ERR', undefined, undefined, {
    status,
    data: { detail },
  } as AxiosResponse);

describe('mapLogError', () => {
  it('puts the single-session cap on the duration field', () => {
    const e = mapLogError(
      rejected(400, 'Session duration of 1500 minutes exceeds the maximum allowed 1440 minutes.'),
    );
    expect(e.target).toBe('duration');
    expect(e.message).toMatch(/1500 minutes/);
  });

  it('puts the daily-total cap on the duration field', () => {
    expect(
      mapLogError(
        rejected(400, "Logging this 60-minute session would bring today's total to 1500 minutes."),
      ).target,
    ).toBe('duration');
  });

  it('explains an end time that is not after the start', () => {
    expect(mapLogError(rejected(400, 'endTime must be after startTime')).target).toBe('duration');
  });

  it('puts future start/end times on the Ended field', () => {
    expect(mapLogError(rejected(400, 'end Time should be past or present')).target).toBe('ended');
    expect(mapLogError(rejected(400, 'start Time should be past or present')).target).toBe('ended');
  });

  it('puts an inactive activity on the activity field', () => {
    const e = mapLogError(rejected(409, 'Activity is inactive: Chess'));
    expect(e.target).toBe('activityName');
    expect(e.message).toBe('Activity is inactive: Chess');
  });

  it('falls back to a form-level message', () => {
    expect(mapLogError(rejected(500, 'boom')).target).toBe('form');
  });

  it('trusts the field names the API sends before reading the wording', () => {
    const withFields = (errors: Record<string, string>) =>
      new AxiosError('failed', 'ERR', undefined, undefined, {
        status: 400,
        data: { detail: 'x', errors },
      } as AxiosResponse);

    expect(mapLogError(withFields({ activityName: 'Activity name is required' })).target).toBe(
      'activityName',
    );
    expect(mapLogError(withFields({ endTime: 'whatever the server says' })).target).toBe('ended');
    expect(mapLogError(withFields({ startTime: 'whatever the server says' })).target).toBe('ended');
  });
});
