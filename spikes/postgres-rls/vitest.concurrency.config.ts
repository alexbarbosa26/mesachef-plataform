import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: { enabled: false },
    fileParallelism: false,
    include: ['tests/postgres/concurrency.integration.test.ts'],
    maxWorkers: 1,
    testTimeout: 60_000,
  },
});
