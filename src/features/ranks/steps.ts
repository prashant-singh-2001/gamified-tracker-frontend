import {
  getTierInfo,
  type Division,
  type RankCard,
  type RankTier,
  type RankTrend,
} from '@/lib/api/types';
import { formatNumber } from '@/lib/utils/format';
import { tierProgress } from './tierProgress';

const ROMAN = ['', 'I', 'II', 'III'] as const;

/** 1 → "I", 2 → "II", 3 → "III". I is the top of a tier. */
export const roman = (division: Division) => ROMAN[division];

/** "Ridge II", or just "Ridge" when the backend sends no division. */
export function stepLabel(tier: RankTier, division?: Division | null): string {
  const { label } = getTierInfo(tier);
  return division ? `${label} ${roman(division)}` : label;
}

/**
 * How far up its tier a card sits, 0-1, as three equal divisions (III is the bottom third).
 * Falls back to the percentile inside the tier band when there is no division.
 */
export function climb(
  card: Pick<RankCard, 'tier' | 'percentile' | 'division' | 'divisionProgress'>,
): number {
  if (card.division && card.divisionProgress != null) {
    const done = 3 - card.division + Math.min(1, Math.max(0, card.divisionProgress));
    return done / 3;
  }
  return tierProgress(card);
}

/** "Top 1%", not "1.25th percentile": `percentile` is a top fraction and 0 is best. */
export function topShare(percentile: number): string {
  return `Top ${Math.max(1, Math.round(percentile * 100))}%`;
}

/**
 * The nudge is approximate and moves as others earn XP, so it is rounded and phrased as "about".
 * 61.3 → 60, 249 → 250, 1,240 → 1,250. Never negative.
 */
export function roughXp(xp: number): number {
  const x = Math.max(0, xp);
  if (x < 10) return Math.ceil(x);
  if (x < 100) return Math.round(x / 5) * 5;
  if (x < 1000) return Math.round(x / 10) * 10;
  return Math.round(x / 50) * 50;
}

export type Nudge =
  | { kind: 'top' }
  | { kind: 'close'; to: string }
  | { kind: 'gap'; to: string; xp: string; exact: boolean };

/** What sits between you and the next step, from the division fields or, without them, the tier. */
export function nudgeFor(card: RankCard): Nudge | null {
  if (card.division) {
    if (card.nextDivision == null || card.nextDivisionTier == null) return { kind: 'top' };
    const to = stepLabel(card.nextDivisionTier, card.nextDivision);
    const xp = card.xpToNextDivision;
    if (xp == null || roughXp(xp) === 0) return { kind: 'close', to };
    return { kind: 'gap', to, xp: formatNumber(roughXp(xp)), exact: false };
  }
  if (card.nextTier === null) return { kind: 'top' };
  if (card.nextTier && card.xpToNextTier != null) {
    return {
      kind: 'gap',
      to: getTierInfo(card.nextTier).label,
      xp: formatNumber(Math.ceil(card.xpToNextTier)),
      exact: true,
    };
  }
  return null;
}

/** The nudge as words: "About 60 XP to Ridge I", "Almost at Ridge I", "Top tier". */
export function nudgeText(nudge: Nudge, withDivisions: boolean): string {
  if (nudge.kind === 'top')
    return withDivisions ? 'You are at the top of the mountain.' : 'Top tier';
  if (nudge.kind === 'close') return `Almost at ${nudge.to}`;
  return `${nudge.exact ? '' : 'About '}${nudge.xp} XP to ${nudge.to}`;
}

export type MovementKind = 'new' | 'promoted' | 'demoted' | 'up' | 'down' | 'steady';

export type Movement = {
  kind: MovementKind;
  /** Full sentence for the rank card. */
  label: string;
  /** Short form for a table row: "+3", "Promoted". */
  short: string;
};

type MovementSource = {
  tier: RankTier;
  division?: Division;
  trend?: RankTrend | null;
  positionChange?: number | null;
};

const places = (n: number) => `${n} ${n === 1 ? 'place' : 'places'}`;

/**
 * Lead with `trend`; show the number of places only when it agrees (a promotion with fewer places
 * can happen when many people join). The baseline is about a day long and resets, so it is
 * "recently", never "since yesterday". Setbacks are not shamed: the climb continues.
 */
export function movementOf(source: MovementSource): Movement | null {
  const { trend, positionChange } = source;
  if (!trend) return null;
  const step = stepLabel(source.tier, source.division);
  switch (trend) {
    case 'NEW':
      return { kind: 'new', label: 'New on the mountain', short: 'New' };
    case 'PROMOTED':
      return { kind: 'promoted', label: `Promoted to ${step}`, short: 'Promoted' };
    case 'DEMOTED':
      return { kind: 'demoted', label: `Now ${step}. The climb continues.`, short: 'Lower step' };
    case 'UP': {
      const n = positionChange != null && positionChange > 0 ? positionChange : null;
      return {
        kind: 'up',
        label: n ? `Up ${places(n)} recently` : 'Moving up recently',
        short: n ? `+${n}` : 'Up',
      };
    }
    case 'DOWN': {
      const n = positionChange != null && positionChange < 0 ? -positionChange : null;
      return {
        kind: 'down',
        label: n
          ? `Down ${places(n)} recently. The climb continues.`
          : 'Eased back recently. The climb continues.',
        short: n ? `−${n}` : 'Down',
      };
    }
    case 'SAME':
      return { kind: 'steady', label: 'Holding steady', short: 'Steady' };
  }
}

export type RankShift =
  | { kind: 'none' }
  | { kind: 'joined'; to: string }
  | { kind: 'tier'; to: string }
  | { kind: 'division'; to: string }
  | { kind: 'places'; places: number };

const stepIndex = (tier: RankTier, division?: Division) =>
  getTierInfo(tier).order * 3 + (division ? 3 - division : 0);

/** What changed between two snapshots of the card, for the moment after logging a session. */
export function rankShift(before: RankCard | null, after: RankCard | null): RankShift {
  if (!after) return { kind: 'none' };
  const to = stepLabel(after.tier, after.division);
  if (!before) return { kind: 'joined', to };
  if (getTierInfo(after.tier).order > getTierInfo(before.tier).order) return { kind: 'tier', to };
  const was = stepIndex(before.tier, before.division);
  const now = stepIndex(after.tier, after.division);
  if (now > was) return { kind: 'division', to };
  const gained = before.position - after.position;
  return now === was && gained > 0 ? { kind: 'places', places: gained } : { kind: 'none' };
}
