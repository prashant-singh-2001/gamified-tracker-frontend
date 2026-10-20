export type Role = 'USER' | 'ADMIN';

export type RankTier =
  | 'SUMMIT'
  | 'PEAK'
  | 'RIDGE'
  | 'ALPINE'
  | 'ASCENT'
  | 'HIGHLAND'
  | 'FOOTHILL'
  | 'TRAILHEAD'
  | 'BASECAMP';

/** Mirrors gamification-service RankCardDto. */
export type RankCard = {
  tier: RankTier;
  overallLevel: number;
  totalXp: number;
  /**
   * Despite the name this is a "top fraction" in [0, 1): 0 is the best user, 0.25 means
   * "top 25%". It is what the backend maps onto tiers (RankTier.fromTopFraction).
   */
  percentile: number;
  position: number;
  totalUsers: number;
  updatedAt: string; // ISO LocalDateTime
  /**
   * The rank nudge. Absent on older backends, so every use has a fallback. `nextTier` is the next
   * better tier that currently has members (empty tiers are skipped); null at the top.
   */
  tierCutoffXp?: number;
  nextTier?: RankTier | null;
  xpToNextTier?: number | null;
};

/** RFC 7807 body returned by every backend service (Spring ProblemDetail). */
export type ProblemDetail = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  [extension: string]: unknown;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};
export type LoginRequest = { email: string; password: string };
export type RefreshRequest = { refreshToken: string };
export type AuthResponse = { accessToken: string; refreshToken: string };

export type RankTierInfo = {
  id: RankTier;
  label: string;
  /** 1 = Basecamp (lowest) … 9 = Summit. */
  order: number;
  /** Inclusive lower / exclusive upper bound of the top fraction (0 = best). */
  topFrom: number;
  topTo: number;
  /** Human readable band, as shown on the ladder. */
  band: string;
};

/** Ordered Basecamp → Summit, as drawn on the tier ladder. */
export const RANK_TIERS: readonly RankTierInfo[] = [
  { id: 'BASECAMP', label: 'Basecamp', order: 1, topFrom: 0.95, topTo: 1, band: 'Bottom 5%' },
  { id: 'TRAILHEAD', label: 'Trailhead', order: 2, topFrom: 0.85, topTo: 0.95, band: '85–95%' },
  { id: 'FOOTHILL', label: 'Foothill', order: 3, topFrom: 0.75, topTo: 0.85, band: '75–85%' },
  { id: 'HIGHLAND', label: 'Highland', order: 4, topFrom: 0.6, topTo: 0.75, band: '60–75%' },
  { id: 'ASCENT', label: 'Ascent', order: 5, topFrom: 0.5, topTo: 0.6, band: '50–60%' },
  { id: 'ALPINE', label: 'Alpine', order: 6, topFrom: 0.25, topTo: 0.5, band: '25–50%' },
  { id: 'RIDGE', label: 'Ridge', order: 7, topFrom: 0.15, topTo: 0.25, band: '15–25%' },
  { id: 'PEAK', label: 'Peak', order: 8, topFrom: 0.05, topTo: 0.15, band: '5–15%' },
  { id: 'SUMMIT', label: 'Summit', order: 9, topFrom: 0, topTo: 0.05, band: 'Top 5%' },
];

export function getTierInfo(tier: RankTier): RankTierInfo {
  const info = RANK_TIERS.find((t) => t.id === tier);
  if (!info) throw new Error(`Unknown rank tier: ${tier}`);
  return info;
}

export type Category = 'STUDY' | 'WORK' | 'GAMING' | 'CHORES' | 'HEALTH' | 'OTHER';

export const CATEGORIES: readonly Category[] = [
  'STUDY',
  'WORK',
  'HEALTH',
  'CHORES',
  'GAMING',
  'OTHER',
];

export const CATEGORY_LABEL: Record<Category, string> = {
  STUDY: 'Study',
  WORK: 'Work',
  HEALTH: 'Health',
  CHORES: 'Chores',
  GAMING: 'Gaming',
  OTHER: 'Other',
};

/** Mirrors activity-service Category.baseXpMultiplier(). */
export const CATEGORY_DEFAULT_MULTIPLIER: Record<Category, number> = {
  STUDY: 1.5,
  WORK: 1.5,
  HEALTH: 1.3,
  OTHER: 1.0,
  CHORES: 0.8,
  GAMING: 0.5,
};
