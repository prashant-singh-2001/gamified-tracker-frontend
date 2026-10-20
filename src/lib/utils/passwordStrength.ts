export type PasswordStrength = { level: 0 | 1 | 2 | 3; label: string };

/**
 * Advisory only: the backend sets no password rule, so this never blocks sign-up.
 * Length counts most, then how many kinds of character are used.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return { level: 0, label: '' };
  const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  const length = password.length;
  if (length >= 12 && kinds >= 3) return { level: 3, label: 'Strong' };
  if (length >= 8 && kinds >= 2) return { level: 2, label: 'Okay' };
  return { level: 1, label: 'Weak' };
}
