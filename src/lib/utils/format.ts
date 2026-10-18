const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatXp(xp: number): string {
  return `${numberFormat.format(Math.round(xp))} XP`;
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** "Top 25%" from a position in the ranking; never shows "Top 0%". */
export function formatTopPercent(position: number, totalUsers: number): string {
  if (totalUsers <= 0) return '—';
  return `Top ${Math.max(1, Math.ceil((position / totalUsers) * 100))}%`;
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
