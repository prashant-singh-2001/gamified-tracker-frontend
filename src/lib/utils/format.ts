const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatXp(xp: number): string {
  return `${numberFormat.format(Math.round(xp))} XP`;
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/**
 * "Top 31%" from the rank card's `percentile` (a top fraction, 0 = best). That is the number the
 * backend assigns tiers from, so it always agrees with the tier band shown next to it. Never
 * "Top 0%".
 */
export function formatTopPercent(percentile: number): string {
  return `Top ${Math.max(1, Math.round(percentile * 100))}%`;
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDuration(minutes: number): string {
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** "Today · 8:00 AM – 9:30 AM" (or the weekday and date for other days), in local time. */
export function formatTimeRange(start: Date, end: Date, now: Date = new Date()): string {
  const time = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const day = sameLocalDay(end, now)
    ? 'Today'
    : end.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return `${day} · ${time(start)} – ${time(end)}`;
}

/** 1.5 → "×1.5", 1.15 → "×1.15", 1 → "×1". */
export function formatMultiplier(value: number): string {
  return `×${Number(value.toFixed(2))}`;
}

/** "just now", "5 min ago", "3 h ago", "Yesterday", then the weekday and date. */
export function timeAgo(date: Date, now: Date = new Date()): string {
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  if (hours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
