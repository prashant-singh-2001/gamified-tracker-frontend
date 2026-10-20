import { describe, expect, it } from 'vitest';
import { passwordStrength } from './passwordStrength';

describe('passwordStrength', () => {
  it('says nothing for an empty password', () => {
    expect(passwordStrength('')).toEqual({ level: 0, label: '' });
  });

  it('rates short or single-kind passwords as weak', () => {
    expect(passwordStrength('abc').label).toBe('Weak');
    expect(passwordStrength('abcdefghijkl').label).toBe('Weak');
  });

  it('rates mid-length mixed passwords as okay', () => {
    expect(passwordStrength('abcd1234')).toEqual({ level: 2, label: 'Okay' });
  });

  it('rates long, varied passwords as strong', () => {
    expect(passwordStrength('Correct-horse-9')).toEqual({ level: 3, label: 'Strong' });
  });
});
