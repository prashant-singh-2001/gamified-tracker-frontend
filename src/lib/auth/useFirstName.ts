import { useState } from 'react';
import { profileStorage } from './profileStorage';
import { useUserId } from './useUserId';

/** The signed-in user's first name, if this browser knows it for THIS user; otherwise null. */
export function useFirstName(): string | null {
  const userId = useUserId();
  const [profile] = useState(() => profileStorage.get());
  return profile && profile.userId === userId ? profile.firstName : null;
}
