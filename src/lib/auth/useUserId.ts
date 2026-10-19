import { useAuthStore } from './authStore';

/**
 * The logged-in user's id, or undefined. Deliberately non-throwing: during logout the store is
 * cleared a moment before navigation, and mounted pages must not crash in between. Hooks that
 * need it pass `enabled: userId !== undefined`.
 */
export function useUserId(): number | undefined {
  return useAuthStore((s) => s.user?.id);
}
