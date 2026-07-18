import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: { enabled: false },
    fileParallelism: false,
    include: ['tests/postgres.integration.test.ts'],
    maxWorkers: 1,
    testTimeout: 30_000,
  },
});

