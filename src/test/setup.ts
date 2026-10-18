import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { useAuthStore } from '@/lib/auth/authStore';
import { setSessionExpiredHandler } from '@/lib/auth/session';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  setSessionExpiredHandler(null);
  useAuthStore.setState({ status: 'booting', accessToken: null, user: null });
});

afterAll(() => server.close());
