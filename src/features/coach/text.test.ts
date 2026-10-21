import { describe, expect, it } from 'vitest';
import { paragraphs, weekLabel } from './text';

describe('paragraphs', () => {
  it('splits on blank lines and keeps a single line break inside a paragraph', () => {
    expect(paragraphs('Good week.\n\nStudy led.\nHealth slipped.\n\n\nTry mornings.')).toEqual([
      'Good week.',
      'Study led.\nHealth slipped.',
      'Try mornings.',
    ]);
  });

  it('handles Windows line ends, stray spaces and blank-only lines', () => {
    expect(paragraphs('  One   two. \r\n \r\nThree.\r\n')).toEqual(['One two.', 'Three.']);
  });

  it('gives one paragraph for plain text and none for nothing', () => {
    expect(paragraphs('Just this.')).toEqual(['Just this.']);
    expect(paragraphs(null)).toEqual([]);
    expect(paragraphs('   \n\n  ')).toEqual([]);
  });
});

describe('weekLabel', () => {
  it('names the month once inside a month', () => {
    expect(weekLabel('2026-10-15', '2026-10-21')).toBe('15–21 Oct');
  });

  it('names both months across a month', () => {
    expect(weekLabel('2026-09-28', '2026-10-04')).toMatch(/^28 Sep(t)? – 4 Oct$/);
  });

  it('names both years across a year', () => {
    expect(weekLabel('2026-12-29', '2027-01-04')).toBe('29 Dec 2026 – 4 Jan 2027');
  });

  it('does not slip a day in a zone ahead of UTC', () => {
    // Tests run in Asia/Kolkata; the first of the month must stay the first.
    expect(weekLabel('2026-11-01', '2026-11-07')).toBe('1–7 Nov');
  });
});
