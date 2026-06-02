import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    environment: 'node',
    env: {
      SQUADRA_API_URL:        'https://api.squadra.com.br/api',
      SESSION_SECRET:         'test-secret-32-chars-minimum-ok!',
      SQUADRA_API_TIMEOUT_MS: '15000',
      NEXT_PUBLIC_APP_URL:    'http://localhost:3000',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
