import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/apps/web/.next/**',
      '**/apps/api/dist/**',
      '**/apps/worker/dist/**',
      '**/packages/*/dist/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        'dist',
        '.next',
        '.turbo',
        'coverage',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/test-setup.ts',
      ],
    },
    setupFiles: ['./apps/api/src/test/global-setup.ts'],
  },
  resolve: {
    alias: {
      '@agentops/shared': path.resolve(__dirname, './packages/shared/src'),
      '@agentops/ai': path.resolve(__dirname, './packages/ai/src'),
      '@agentops/workflow': path.resolve(__dirname, './packages/workflow/src'),
      '@agentops/db': path.resolve(__dirname, './packages/db/src'),
    },
  },
});
