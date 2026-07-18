import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/*.sqlite.integration.test.{ts,tsx}'],
    passWithNoTests: false,
    testTimeout: 10_000,
  },
});
