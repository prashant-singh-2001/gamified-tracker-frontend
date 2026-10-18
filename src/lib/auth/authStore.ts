import { jwtDecode } from 'jwt-decode';
import { create } from 'zustand';
import type { Role } from '@/lib/api/types';

export type AuthUser = { id: number; role: Role };
export type AuthStatus = 'booting' | 'authed' | 'anon';

type AccessClaims = { userId: number | string; role: Role };

type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
  user: AuthUser | null;
  /** Decodes the access token; throws if it carries no usable userId/role. */
  setAccessToken: (accessToken: string) => void;
  clear: () => void;
};

export function decodeAccessToken(accessToken: string): AuthUser {
  const { userId, role } = jwtDecode<AccessClaims>(accessToken);
  const id = Number(userId);
  if (!Number.isFinite(id) || (role !== 'USER' && role !== 'ADMIN')) {
    throw new Error('Access token is missing userId/role claims');
  }
  return { id, role };
}

/** Tiny on purpose: auth session only. Server data belongs in TanStack Query. */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'booting',
  accessToken: null,
  user: null,
  setAccessToken: (accessToken) =>
    set({ accessToken, user: decodeAccessToken(accessToken), status: 'authed' }),
  clear: () => set({ accessToken: null, user: null, status: 'anon' }),
}));
