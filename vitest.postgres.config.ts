import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/**/*.postgres.integration.test.{ts,tsx}'],
    passWithNoTests: false,
    testTimeout: 20_000,
  },
});
