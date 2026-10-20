import { useEffect, useState } from 'react';

/**
 * Whether the user's own row (once it has been rendered) is on screen. Without
 * IntersectionObserver a rendered row counts as visible, so nothing is pinned twice.
 */
export function useOwnRowVisible(row: HTMLElement | null): boolean {
  const [visible, setVisible] = useState(false);
  const supported = typeof IntersectionObserver !== 'undefined';

  useEffect(() => {
    if (!row || !supported) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!!entry?.isIntersecting));
    observer.observe(row);
    return () => observer.disconnect();
  }, [row, supported]);

  if (!row) return false;
  return supported ? visible : true;
}
