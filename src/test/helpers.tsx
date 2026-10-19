import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor } from '@testing-library/react';
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

const testClients = new Set<QueryClient>();

/**
 * No retries, so failures surface immediately. `staleTime` mirrors the app's, otherwise freshly
 * seeded or fetched data would count as stale and be refetched the moment a component mounts.
 */
export function makeTestQueryClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 }, mutations: { retry: false } },
  });
  testClients.add(client);
  return client;
}

/**
 * Waits for every in-flight request of every test client. Without this a test can finish while
 * a request is still travelling, and that request then lands on the NEXT test's handlers.
 */
export async function settleTestQueryClients() {
  await waitFor(() => {
    for (const client of testClients) {
      expect(client.isFetching() + client.isMutating()).toBe(0);
    }
  });
  testClients.clear();
}

export function renderRoutes(
  routes: RouteObject[],
  initialEntry = '/',
  /** Runs before the first render, e.g. to seed the cache like a just-completed mutation. */
  seed?: (queryClient: QueryClient) => void,
) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
  const queryClient = makeTestQueryClient();
  seed?.(queryClient);
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { ...utils, router, queryClient };
}
