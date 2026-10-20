import { useEffect, useRef } from 'react';
import { RouteMap } from '@/components/route-map/RouteMap';
import type { Face } from './FlipCard';

/** How far up the route the marker waits on the Log in face (a fraction of the route's length), between two tier markers so it implies no rank. */
const LOGIN_AT = 0.44;
const TRAVEL_MS = 700;

/**
 * The route map behind the sign-in card. A marker sits at Basecamp on the Sign up face and travels
 * up the route when the card turns to Log in, and back again: the motion answers the flip.
 */
export function AuthMap({ face }: { face: Face }) {
  const routeRef = useRef<SVGPathElement>(null);
  const markerRef = useRef<SVGGElement>(null);
  const distance = useRef<number | null>(null);

  useEffect(() => {
    const route = routeRef.current;
    const marker = markerRef.current;
    if (!route || !marker || typeof route.getTotalLength !== 'function') return;

    const total = route.getTotalLength();
    const target = face === 'back' ? 0 : total * LOGIN_AT;
    const place = (length: number) => {
      const p = route.getPointAtLength(length);
      marker.setAttribute('transform', `translate(${p.x} ${p.y})`);
      marker.setAttribute('opacity', '1');
      distance.current = length;
    };

    const from = distance.current ?? target;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (from === target || still) {
      place(target);
      return;
    }

    const started = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - started) / TRAVEL_MS);
      place(from + (target - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [face]);

  return (
    <RouteMap animate={false} routeRef={routeRef}>
      <g ref={markerRef} opacity="0" data-testid="route-marker">
        <circle r="26" fill="var(--accent)" opacity="0.18" />
        <circle r="12" fill="var(--accent)" stroke="var(--surface)" strokeWidth="4" />
      </g>
    </RouteMap>
  );
}
