import type { RequestHandler } from 'msw';

/**
 * Default gateway handlers. Empty on purpose: the server runs with onUnhandledFrame: 'error',
 * so every test declares exactly the endpoints it expects via server.use(...).
 */
export const handlers: RequestHandler[] = [];
