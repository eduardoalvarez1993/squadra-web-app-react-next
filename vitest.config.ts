import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    // Ambiente node por default; testes de componente (Fase 5) declaram
    // `// @vitest-environment jsdom` no topo do próprio arquivo.
    environment: 'node',
    setupFiles: ['src/__tests__/setup-msw.ts'],
    env: {
      SQUADRA_API_URL:        'https://api.squadra.com.br/api',
      SESSION_SECRET:         'test-secret-32-chars-minimum-ok!',
      SQUADRA_API_TIMEOUT_MS: '15000',
      NEXT_PUBLIC_APP_URL:    'http://localhost:3000',
      ALLOWED_ORIGINS:        'http://localhost:3000',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
        'src/__tests__/**',          // fixtures + setup
        'src/app/**/layout.tsx',
        'src/components/ui/**',       // primitivos shadcn — cobertos via e2e
        'src/lib/assets.ts',
        '**/*.stories.*',
      ],
      // Thresholds = piso de NÃO-REGRESSÃO, medidos sobre TODO o src/ (denominador
      // = app inteiro, ~4355 stmts). O global fica baixo de propósito: páginas e
      // componentes .tsx vão para o e2e (Playwright), não para unit.
      // Progresso: Fase 0 ≈ 2,4% → Fases 1-3 ≈ 5,5% → Fase 4 (rotas/MSW) ≈ 12,3%.
      // Alvos testados têm cobertura alta (rotas sensíveis 88-91%, lib 64%+,
      // squadra-client ~50%); o global é puxado p/ baixo pelas rotas/páginas
      // ainda não cobertas (vão p/ Fase 5/e2e). Fase 6 fecha com alvo POR-PASTA.
      thresholds: {
        statements: 12,
        branches:   13,
        functions:  7,
        lines:      12,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
