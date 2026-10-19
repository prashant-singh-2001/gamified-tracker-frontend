import { describe, expect, it } from 'vitest';
import { formatGreetingDate, greetingFor } from './greeting';

const at = (hour: number) => new Date(2026, 9, 19, hour, 0, 0);

describe('greeting', () => {
  it('follows the time of day', () => {
    expect(greetingFor(at(0))).toBe('Good morning');
    expect(greetingFor(at(11))).toBe('Good morning');
    expect(greetingFor(at(12))).toBe('Good afternoon');
    expect(greetingFor(at(17))).toBe('Good afternoon');
    expect(greetingFor(at(18))).toBe('Good evening');
    expect(greetingFor(at(23))).toBe('Good evening');
  });

  it('formats the date like "Mon 19 Oct"', () => {
    expect(formatGreetingDate(at(9))).toBe('Mon 19 Oct');
    expect(formatGreetingDate(new Date(2026, 0, 5))).toBe('Mon 5 Jan');
  });
});
