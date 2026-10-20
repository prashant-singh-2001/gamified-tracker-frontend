import { describe, expect, it } from 'vitest';
import { formatDuration, formatMultiplier, formatTopPercent, formatXp, timeAgo } from './format';

describe('formatTopPercent', () => {
  it('rounds the API top fraction to a whole percent', () => {
    expect(formatTopPercent(0.31)).toBe('Top 31%');
    expect(formatTopPercent(0.5)).toBe('Top 50%');
    expect(formatTopPercent(0.249)).toBe('Top 25%');
  });

  it('never says "Top 0%" for the very best user', () => {
    expect(formatTopPercent(0)).toBe('Top 1%');
    expect(formatTopPercent(0.004)).toBe('Top 1%');
  });
});

describe('timeAgo', () => {
  const now = new Date(2026, 9, 19, 12, 0, 0);
  const ago = (ms: number) => new Date(now.getTime() - ms);
  const MIN = 60_000;
  const HOUR = 60 * MIN;

  it('reads naturally at each scale', () => {
    expect(timeAgo(ago(20_000), now)).toBe('just now');
    expect(timeAgo(ago(5 * MIN), now)).toBe('5 min ago');
    expect(timeAgo(ago(3 * HOUR), now)).toBe('3 h ago');
    expect(timeAgo(ago(30 * HOUR), now)).toBe('Yesterday');
    expect(timeAgo(ago(72 * HOUR), now)).toBe('Fri, Oct 16');
  });
});

describe('other formatters', () => {
  it('formats XP, durations and multipliers', () => {
    expect(formatXp(1234.4)).toBe('1,234 XP');
    expect(formatDuration(90)).toBe('1 h 30 min');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatMultiplier(1.25)).toBe('×1.25');
    expect(formatMultiplier(1)).toBe('×1');
  });
});
