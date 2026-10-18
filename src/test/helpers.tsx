import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import type { Role } from '@/lib/api/types';
import { useAuthStore } from '@/lib/auth/authStore';

function base64Url(value: object): string {
  return btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/** An unsigned JWT carrying the claims the gateway puts in real access tokens. */
export function makeAccessToken(userId: number, role: Role, nonce = ''): string {
  return `${base64Url({ alg: 'none', typ: 'JWT' })}.${base64Url({ userId, role, nonce })}.sig`;
}

export function signIn(userId = 1, role: Role = 'USER') {
  useAuthStore.getState().setAccessToken(makeAccessToken(userId, role));
}

/** No retries, so failing requests surface immediately instead of after a backoff. */
export function makeTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

export function renderRoutes(routes: RouteObject[], initialEntry = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  const queryClient = makeTestQueryClient();
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...utils, router, queryClient };
}
