export function greetingFor(date: Date): 'Good morning' | 'Good afternoon' | 'Good evening' {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** "Mon 19 Oct", in the viewer's local calendar. */
export function formatGreetingDate(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday} ${date.getDate()} ${month}`;
}
