/**
 * Leaderboard rows only carry a `userId` (no display name yet), so people are shown as
 * "Climber #4821" and the current user as "You". Swap this out once the API returns names.
 */
export function displayName(userId: number, currentUserId?: number | null): string {
  return userId === currentUserId ? 'You' : `Climber #${userId}`;
}
