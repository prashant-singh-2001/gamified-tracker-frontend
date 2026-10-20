/**
 * How a climber appears on a board: "You" for the signed-in user, otherwise the name the API
 * sends (first name plus last initial), falling back to "Climber #4821" when it has none.
 */
export function displayName(
  userId: number,
  currentUserId?: number | null,
  name?: string | null,
): string {
  if (userId === currentUserId) return 'You';
  const trimmed = name?.trim();
  return trimmed ? trimmed : `Climber #${userId}`;
}
