import { describe, expect, it } from 'vitest';
import { displayName } from './names';

describe('displayName', () => {
  it('uses the name from the API', () => {
    expect(displayName(4, 9, 'Ada L.')).toBe('Ada L.');
  });

  it('falls back to a numbered climber when the API has no name', () => {
    expect(displayName(4, 9, null)).toBe('Climber #4');
    expect(displayName(4, 9, '   ')).toBe('Climber #4');
    expect(displayName(4, 9)).toBe('Climber #4');
  });

  it('is always "You" for the signed-in user', () => {
    expect(displayName(9, 9, 'Ada L.')).toBe('You');
  });
});
