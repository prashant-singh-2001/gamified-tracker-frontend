import { useEffect, useState } from 'react';

const MIN_TRAVEL = 8; // px of scroll before the direction counts
const REVEAL_ABOVE = 80; // never hide while near the top of the page

/** True while the user scrolls down, false when they scroll back up. Never hides with reduced motion. */
export function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < MIN_TRAVEL) return;
      setHidden(y > last && y > REVEAL_ABOVE);
      last = y;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return hidden;
}
