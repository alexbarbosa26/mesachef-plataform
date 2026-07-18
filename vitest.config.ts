import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.integration.test.{ts,tsx}',
    ],
    include: ['{apps,packages}/**/*.test.{ts,tsx}'],
    passWithNoTests: false,
    testTimeout: 5_000,
  },
});
