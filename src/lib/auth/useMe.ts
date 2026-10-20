import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { qk } from '@/lib/api/queryKeys';
import type { Role } from '@/lib/api/types';
import { useUserId } from './useUserId';

/** `GET /users/me`: the caller's own name and role. Never includes the email. */
export type Me = { id: number; firstName: string; lastName: string; role: Role };

/** The signed-in user's profile, so the name shows on any browser, not only where they signed up. */
export function useMe() {
  const userId = useUserId();
  return useQuery({
    queryKey: qk.users.me(),
    enabled: userId !== undefined,
    queryFn: async () => (await api.get<Me>(endpoints.users.me)).data,
    staleTime: 10 * 60_000,
  });
}
