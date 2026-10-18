import axios from 'axios';
import { API_BASE_URL } from '@/lib/api/config';
import { endpoints } from '@/lib/api/endpoints';
import type { AuthResponse } from '@/lib/api/types';
import { useAuthStore } from './authStore';
import { tokenStorage } from './tokenStorage';

type ExpiredHandler = () => void;
let onSessionExpired: ExpiredHandler | null = null;

/** The router registers this so the API layer can redirect without importing it. */
export function setSessionExpiredHandler(handler: ExpiredHandler | null): void {
  onSessionExpired = handler;
}

/** Stores a fresh token pair (login, register or refresh). */
export function startSession({ accessToken, refreshToken }: AuthResponse): void {
  useAuthStore.getState().setAccessToken(accessToken);
  tokenStorage.setRefreshToken(refreshToken);
}

export function endSession(): void {
  useAuthStore.getState().clear();
  tokenStorage.clear();
}

let inFlight: Promise<string> | null = null;

/**
 * Exchanges the refresh token for a new pair. The backend rotates refresh tokens, so
 * concurrent callers MUST share one request: the first caller creates the promise, the
 * rest await it. Uses plain axios (no interceptors) so a failing refresh can't loop.
 */
export function refreshSession(): Promise<string> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');
    const { data } = await axios.post<AuthResponse>(`${API_BASE_URL}${endpoints.auth.refresh}`, {
      refreshToken,
    });
    startSession(data);
    return data.accessToken;
  })()
    .catch((err: unknown) => {
      endSession();
      onSessionExpired?.();
      throw err;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Called once on app start: restores a session from the stored refresh token, if any. */
export async function bootSession(): Promise<void> {
  if (!tokenStorage.getRefreshToken()) {
    useAuthStore.getState().clear();
    return;
  }
  try {
    await refreshSession();
  } catch {
    /* refreshSession already ended the session */
  }
}
