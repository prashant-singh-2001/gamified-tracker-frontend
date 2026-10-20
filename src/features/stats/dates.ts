/** "Tue, 14 Oct" for a `YYYY-MM-DD` UTC calendar day, formatted in UTC so it cannot slip a day. */
export function dayLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}
