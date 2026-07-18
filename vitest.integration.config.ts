import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['{apps,packages}/**/*.integration.test.{ts,tsx}'],
    passWithNoTests: false,
    testTimeout: 10_000,
  },
});
