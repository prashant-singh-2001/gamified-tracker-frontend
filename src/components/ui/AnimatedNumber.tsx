import { useEffect, useRef, useState } from 'react';
import { formatNumber } from '@/lib/utils/format';

const DURATION = 600; // ms

type AnimatedNumberProps = {
  value: number;
  /** Rendered text for a whole number; defaults to thousands separators. */
  format?: (value: number) => string;
  className?: string;
};

/**
 * A number that glides to its new value when a refresh changes it, instead of jumping. It shows
 * the value at once on first render, and jumps straight there when reduced motion is on. Digits
 * are tabular so the width does not shift while it counts.
 */
export function AnimatedNumber({ value, format = formatNumber, className }: AnimatedNumberProps) {
  const [shown, setShown] = useState(value);
  const current = useRef(value);

  useEffect(() => {
    if (current.current === value) return;
    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    if (reduce) {
      frame = requestAnimationFrame(() => {
        current.current = value;
        setShown(value);
      });
      return () => cancelAnimationFrame(frame);
    }
    const from = current.current;
    const start = performance.now();
    const tick = () => {
      const t = Math.min(1, Math.max(0, (performance.now() - start) / DURATION));
      const eased = 1 - (1 - t) ** 3;
      current.current = from + (value - from) * eased;
      setShown(current.current);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className={className}>{format(Math.round(shown))}</span>;
}
