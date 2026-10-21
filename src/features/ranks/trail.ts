import { smoothPath, type Point } from '@/components/route-map/contours';
import { RANK_TIERS } from '@/lib/api/types';

/** Height of one tier row on the Mountain tab, and the width of the trail beside the rows. */
export const ROW_H = 64;
export const TRAIL_W = 56;

const LEFT = 18;
const RIGHT = 38;
const COUNT = RANK_TIERS.length;

/** Rows run Summit (0) to Basecamp (8); the trail zigzags gently between two columns. */
export const rowOfTier = (order: number) => COUNT - order;

export function nodePoint(row: number): Point {
  return { x: row % 2 === 0 ? RIGHT : LEFT, y: row * ROW_H + ROW_H / 2 };
}

/** The switchback trail through every tier's node, as an SVG path. */
export function trailPath(): string {
  return smoothPath(Array.from({ length: COUNT }, (_, row) => nodePoint(row)));
}

/** Share of the way to the next tier's node the marker may travel; the row edge is at 0.5. */
const IN_ROW = 0.45;

/**
 * Where "You" sits: on your tier's node at the bottom of your band, moving up the trail towards
 * the next tier as `progress` (0-1) grows, but never past your own row's top edge, so the marker
 * always reads as inside your tier. At Summit there is nowhere further up, so it stays on the node.
 */
export function markerPoint(tierOrder: number, progress: number): Point {
  const row = rowOfTier(tierOrder);
  const from = nodePoint(row);
  if (row === 0) return from;
  const to = nodePoint(row - 1);
  const t = Math.min(1, Math.max(0, progress)) * IN_ROW;
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}
