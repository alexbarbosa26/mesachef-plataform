import { describe, expect, it } from 'vitest';

import { createDatabaseHealthProbe } from './database-health-probe.js';

describe('SQLite database health probe', () => {
  it('checks a real in-memory SQLite connection', async () => {
    const probe = createDatabaseHealthProbe({
      connectionString: ':memory:',
      connectionTimeoutMs: 1_000,
      poolMax: 1,
      provider: 'sqlite',
    });

    await expect(probe.check()).resolves.toEqual({ status: 'up' });
    await probe.close();
  });
});
