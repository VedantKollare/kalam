import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

// Test config kept separate from vite.config.ts so the app build stays lean
// (no test deps in the bundle). Run with `npm test`.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { 'dictionary-en-files': fileURLToPath(new URL('node_modules/dictionary-en', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
  },
});
