/**
 * The API exposes no profile and the JWT carries no name, so the first name is only known when
 * the user signed up on this browser. It is stored with the user id so a different account
 * logging in later never shows someone else's name.
 */
const PROFILE_KEY = 'etram.profile';

export type LocalProfile = { userId: number; firstName: string };

export const profileStorage = {
  get(): LocalProfile | null {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return null;
      const value: unknown = JSON.parse(raw);
      if (
        typeof value === 'object' &&
        value !== null &&
        'userId' in value &&
        'firstName' in value &&
        typeof value.userId === 'number' &&
        typeof value.firstName === 'string'
      ) {
        return { userId: value.userId, firstName: value.firstName };
      }
      return null;
    } catch {
      return null;
    }
  },
  set(profile: LocalProfile): void {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      /* the greeting simply won't use a name */
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch {
      /* nothing to clear */
    }
  },
};
