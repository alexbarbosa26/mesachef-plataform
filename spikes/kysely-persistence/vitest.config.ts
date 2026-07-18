import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: { enabled: false },
    exclude: ['tests/postgres.integration.test.ts'],
    fileParallelism: false,
    include: ['tests/**/*.test.ts'],
    maxWorkers: 1,
    testTimeout: 15_000,
  },
});
