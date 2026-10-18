import type { Role } from '@/lib/api/types';

/** Where a freshly authenticated user lands when there is no `next` target. */
export function homeFor(role: Role): string {
  return role === 'ADMIN' ? '/admin' : '/app';
}

/** Builds `/login?next=<path>` for the guard and the session-expired redirect. */
export function loginUrl(next: string): string {
  return `/login?next=${encodeURIComponent(next)}`;
}

/**
 * Only same-origin absolute paths are honoured, so `?next=https://evil.example` or
 * `?next=//evil.example` can never turn the login page into an open redirect.
 */
export function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return null;
  }
  return next;
}
