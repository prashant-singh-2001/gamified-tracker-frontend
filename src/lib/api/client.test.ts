import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/lib/auth/authStore';
import { setSessionExpiredHandler, startSession } from '@/lib/auth/session';
import { tokenStorage } from '@/lib/auth/tokenStorage';
import { makeAccessToken } from '@/test/helpers';
import { server } from '@/test/server';
import { api } from './client';
import { getErrorMessage } from './errors';

const OLD = makeAccessToken(1, 'USER', 'old');
const NEW = makeAccessToken(1, 'USER', 'new');

/** Resource endpoint that only accepts the freshly refreshed token. */
function protectedGet(path: string) {
  return http.get(`*${path}`, ({ request }) =>
    request.headers.get('Authorization') === `Bearer ${NEW}`
      ? HttpResponse.json({ ok: true, path })
      : HttpResponse.json({ detail: 'expired' }, { status: 401 }),
  );
}

function refreshHandler(onCall: (body: unknown) => void) {
  return http.post('*/auth/refresh', async ({ request }) => {
    onCall(await request.json());
    await delay(30);
    return HttpResponse.json({ accessToken: NEW, refreshToken: 'refresh-2' });
  });
}

describe('axios client auth handling', () => {
  beforeEach(() => {
    startSession({ accessToken: OLD, refreshToken: 'refresh-1' });
  });

  it('attaches the bearer token and never sends a userId header', async () => {
    let headers: Headers | undefined;
    server.use(
      http.get('*/api/ranks/me', ({ request }) => {
        headers = request.headers;
        return HttpResponse.json({});
      }),
    );
    await api.get('/api/ranks/me');
    expect(headers?.get('Authorization')).toBe(`Bearer ${OLD}`);
    expect(headers?.has('userId')).toBe(false);
  });

  it('refreshes once on a 401, swaps both tokens and retries the request', async () => {
    const refreshBodies: unknown[] = [];
    server.use(
      protectedGet('/api/ranks/me'),
      refreshHandler((b) => refreshBodies.push(b)),
    );

    const res = await api.get('/api/ranks/me');

    expect(res.data).toEqual({ ok: true, path: '/api/ranks/me' });
    expect(refreshBodies).toEqual([{ refreshToken: 'refresh-1' }]);
    expect(useAuthStore.getState().accessToken).toBe(NEW);
    expect(tokenStorage.getRefreshToken()).toBe('refresh-2');
  });

  it('shares ONE refresh between concurrent 401s and retries them all', async () => {
    const refreshBodies: unknown[] = [];
    server.use(
      protectedGet('/api/a'),
      protectedGet('/api/b'),
      protectedGet('/api/c'),
      refreshHandler((b) => refreshBodies.push(b)),
    );

    const results = await Promise.all([api.get('/api/a'), api.get('/api/b'), api.get('/api/c')]);

    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(refreshBodies).toHaveLength(1);
  });

  it('clears the session and signals expiry when the refresh fails', async () => {
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);
    server.use(
      protectedGet('/api/a'),
      protectedGet('/api/b'),
      http.post('*/auth/refresh', () => HttpResponse.json({ detail: 'invalid' }, { status: 401 })),
    );

    const results = await Promise.allSettled([api.get('/api/a'), api.get('/api/b')]);

    expect(results.every((r) => r.status === 'rejected')).toBe(true);
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().status).toBe('anon');
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('does not try to refresh when an /auth/* call itself returns 401', async () => {
    const refreshBodies: unknown[] = [];
    server.use(
      http.post('*/auth/login', () =>
        HttpResponse.json({ detail: 'Invalid email or password' }, { status: 401 }),
      ),
      refreshHandler((b) => refreshBodies.push(b)),
    );

    const error = await api.post('/auth/login', { email: 'a@b.co', password: 'x' }).catch((e) => e);

    expect(getErrorMessage(error)).toBe('Invalid email or password');
    expect(refreshBodies).toHaveLength(0);
  });
});
