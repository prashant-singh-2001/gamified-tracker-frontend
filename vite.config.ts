import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const GATEWAY = 'http://localhost:8080';

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
    // Same-origin requests in dev, so no CORS setup is needed on the gateway.
    proxy: {
      '/api': proxyTo,
      '/auth': proxyTo,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
