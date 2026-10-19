import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { useAuthStore } from '@/lib/auth/authStore';
import { setSessionExpiredHandler } from '@/lib/auth/session';
import { server } from './server';

// jsdom doesn't implement <dialog> modal behaviour; a minimal stand-in keeps sheets testable.
beforeAll(() => {
  const proto = HTMLDialogElement.prototype;
  if (typeof proto.showModal !== 'function') {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    proto.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
});

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  setSessionExpiredHandler(null);
  useAuthStore.setState({ status: 'booting', accessToken: null, user: null });
});

afterAll(() => server.close());
