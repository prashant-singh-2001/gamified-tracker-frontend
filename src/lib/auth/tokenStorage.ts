/**
 * Only the refresh token is persisted (localStorage); the access token lives in memory.
 * Every access is wrapped because storage can throw in private windows or when blocked.
 */
const REFRESH_KEY = 'etram.refreshToken';

export const tokenStorage = {
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  setRefreshToken(token: string): void {
    try {
      localStorage.setItem(REFRESH_KEY, token);
    } catch {
      /* session simply won't survive a reload */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* nothing to clear */
    }
  },
};
