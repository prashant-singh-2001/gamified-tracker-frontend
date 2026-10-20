import { useState } from 'react';

/**
 * A one-line readout for charts: hover, focus or tap a mark and its numbers show above the chart.
 * Unlike a tooltip this works on touch and for keyboard users.
 */
export function useReadout(fallback: string) {
  const [text, setText] = useState<string | null>(null);
  return { text: text ?? fallback, show: setText };
}
