import { createDatabaseHealthProbe } from '@mesachef/database';
import { expect, it } from 'vitest';

import { buildApi } from './app.js';
import type { ApplicationConfig } from './config/environment.js';

it('checks readiness through a real in-memory SQLite dependency', async () => {
  const config: ApplicationConfig = {
    app: {
      environment: 'test',
      host: '127.0.0.1',
      port: 3000,
      publicUrl: 'http://localhost:5173',
    },
    cors: { allowedOrigins: new Set(['http://localhost:5173']) },
    database: {
      connectionString: ':memory:',
      connectionTimeoutMs: 1_000,
      poolMax: 1,
      provider: 'sqlite',
    },
    logLevel: 'silent',
    openApiEnabled: false,
  };
  const databaseProbe = createDatabaseHealthProbe(config.database);
  const app = await buildApi({ config, databaseProbe, logger: false });

  try {
    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      checks: { database: { provider: 'sqlite', status: 'up' } },
      status: 'ok',
    });
  } finally {
    await app.close();
  }
});
