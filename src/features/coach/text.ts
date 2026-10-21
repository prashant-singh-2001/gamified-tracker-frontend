/** The note as paragraphs: split on blank lines, single line breaks kept inside a paragraph. */
export function paragraphs(narrative: string | null | undefined): string[] {
  if (!narrative) return [];
  return narrative
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);
}

const day = (iso: string) => new Date(`${iso}T00:00:00Z`);
const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });

/**
 * "15–21 Oct", or "28 Sep – 4 Oct" when the week crosses a month (and the years when it crosses
 * one). The dates are UTC calendar days, formatted in UTC so they cannot slip a day.
 */
export function weekLabel(start: string, end: string): string {
  const a = day(start);
  const b = day(end);
  if (a.getUTCFullYear() !== b.getUTCFullYear()) {
    const full = { day: 'numeric', month: 'short', year: 'numeric' } as const;
    return `${fmt(a, full)} – ${fmt(b, full)}`;
  }
  if (a.getUTCMonth() !== b.getUTCMonth()) {
    const short = { day: 'numeric', month: 'short' } as const;
    return `${fmt(a, short)} – ${fmt(b, short)}`;
  }
  return `${a.getUTCDate()}–${fmt(b, { day: 'numeric', month: 'short' })}`;
}
