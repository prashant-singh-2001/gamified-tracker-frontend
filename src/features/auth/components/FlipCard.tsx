import { useEffect, useRef, useState, type ReactNode } from 'react';
import './flip.css';

export type Face = 'front' | 'back';

type FlipCardProps = {
  face: Face;
  front: ReactNode;
  back: ReactNode;
};

const FACE_LOOK = 'rounded-[20px] border border-line bg-surface p-6 sm:p-8';

/**
 * Two faces on one card. The face that is down is `inert` and hidden from screen readers, and the
 * card's height follows the face that is up (the back is taller than the front).
 */
export function FlipCard({ face, front, back }: FlipCardProps) {
  const [heights, setHeights] = useState<Record<Face, number | null>>({ front: null, back: null });
  const [lastFace, setLastFace] = useState(face);
  const [turned, setTurned] = useState(false);
  if (face !== lastFace) {
    setLastFace(face);
    setTurned(true);
  }

  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observers = (
      [
        ['front', frontRef.current],
        ['back', backRef.current],
      ] as const
    ).flatMap(([key, el]) => {
      if (!el) return [];
      const observer = new ResizeObserver(() => {
        setHeights((h) => (h[key] === el.offsetHeight ? h : { ...h, [key]: el.offsetHeight }));
      });
      observer.observe(el);
      return [observer];
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const height = heights[face];

  return (
    <div className="flip-lift" data-face={face} data-turned={turned}>
      <div
        className="flip-stage"
        data-face={face}
        data-turned={turned}
        style={height === null ? undefined : { height }}
      >
        <div className="flip-inner">
          <div
            ref={frontRef}
            className={`flip-face flip-face-front ${FACE_LOOK}`}
            inert={face !== 'front'}
            aria-hidden={face !== 'front'}
          >
            {front}
          </div>
          <div
            ref={backRef}
            className={`flip-face flip-face-back ${FACE_LOOK}`}
            inert={face !== 'back'}
            aria-hidden={face !== 'back'}
          >
            {back}
          </div>
        </div>
      </div>
    </div>
  );
}
