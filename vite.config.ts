import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tests run in IST (UTC+5:30) rather than the machine's zone: the backend speaks UTC, so any code
// that mixes up local and UTC time must fail the same way on a UTC CI runner as on a laptop.
process.env.TZ = 'Asia/Kolkata';

// Where /api, /auth and /users go in dev. The dev container points it at the gateway on the backend's
// Docker network (see docker-compose.yml); a local `npm run dev` keeps the default.
const GATEWAY = process.env.VITE_PROXY_TARGET ?? 'http://localhost:8080';

// Browsers attach `Origin: http://localhost:5173` to POSTs even when they are same-origin, and the
// gateway (CORS closed by default) rejects it with a bare 403. Dropping it in the proxy makes the
// request look same-origin to the gateway, so no CORS config is needed in dev.
const proxyTo = {
  target: GATEWAY,
  changeOrigin: true,
  configure: (proxy: {
    on: (event: 'proxyReq', cb: (req: { removeHeader(n: string): void }) => void) => void;
  }) => {
    proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // File events do not cross a Windows or macOS bind mount, so the dev container polls instead.
    watch: process.env.VITE_USE_POLLING ? { usePolling: true, interval: 300 } : undefined,
    // Same-origin requests in dev, so no CORS setup is needed on the gateway.
    proxy: {
      '/api': proxyTo,
      '/auth': proxyTo,
      '/users': proxyTo,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
