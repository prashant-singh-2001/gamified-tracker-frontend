import { useState, type KeyboardEvent, type PointerEvent } from 'react';

/**
 * Pointer and keyboard scrubbing along `count` evenly spaced marks, for charts that are one
 * focusable slider instead of dozens of tab stops. `start` is where keyboard focus lands first.
 */
export function useScrub(count: number, start: number, onMove: (index: number | null) => void) {
  const [index, setIndex] = useState<number | null>(null);

  function move(next: number | null) {
    setIndex(next);
    onMove(next);
  }

  function fromPointer(e: PointerEvent<HTMLElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const share = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    move(Math.round(share * (count - 1)));
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    const current = index ?? start;
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowUp'
        ? Math.min(count - 1, current + 1)
        : e.key === 'ArrowLeft' || e.key === 'ArrowDown'
          ? Math.max(0, current - 1)
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? count - 1
              : null;
    if (next === null) return;
    e.preventDefault();
    move(next);
  }

  return {
    index,
    /** Spread on the element that carries `role="slider"`. */
    props: {
      tabIndex: 0,
      onKeyDown,
      onFocus: () => move(index ?? start),
      onBlur: () => move(null),
      onPointerMove: fromPointer,
      onPointerDown: fromPointer,
      onPointerLeave: () => move(null),
    },
  };
}
