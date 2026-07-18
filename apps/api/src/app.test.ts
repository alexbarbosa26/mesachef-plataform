import type {
  DatabaseHealthCheck,
  DatabaseHealthProbe,
} from '@mesachef/database';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildApi } from './app.js';
import type { ApplicationConfig } from './config/environment.js';

const testConfig: ApplicationConfig = {
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
    provider: 'sqlite',
  },
  logLevel: 'silent',
  openApiEnabled: false,
};

const openApps: Awaited<ReturnType<typeof buildApi>>[] = [];

function createProbe(
  result: DatabaseHealthCheck,
): DatabaseHealthProbe & { check: ReturnType<typeof vi.fn> } {
  return {
    check: vi.fn(async () => result),
    close: vi.fn(async () => undefined),
    provider: 'sqlite',
  };
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map(async (app) => app.close()));
});

describe('MesaChef API foundation', () => {
  it('serves liveness without checking the database', async () => {
    const probe = createProbe({
      error: new Error('database unavailable'),
      status: 'down',
    });
    const app = await buildApi({
      config: testConfig,
      databaseProbe: probe,
      logger: false,
    });
    openApps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health/live' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      service: 'mesachef-api',
      status: 'ok',
    });
    expect(response.headers['x-correlation-id']).toMatch(
      /^[0-9a-f-]{36}$/u,
    );
    expect(probe.check).not.toHaveBeenCalled();
  });

  it('reports readiness when the configured database is available', async () => {
    const app = await buildApi({
      config: testConfig,
      databaseProbe: createProbe({ status: 'up' }),
      logger: false,
    });
    openApps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      checks: { database: { provider: 'sqlite', status: 'up' } },
      status: 'ok',
    });
  });

  it('sanitizes a failed readiness response', async () => {
    const internalMessage = 'password=do-not-leak';
    const app = await buildApi({
      config: testConfig,
      databaseProbe: createProbe({
        error: new Error(internalMessage),
        status: 'down',
      }),
      logger: false,
    });
    openApps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health/ready' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      checks: { database: { provider: 'sqlite', status: 'down' } },
      status: 'not_ready',
    });
    expect(response.body).not.toContain(internalMessage);
  });

  it('uses the standard safe envelope for unhandled errors', async () => {
    const app = await buildApi({
      config: testConfig,
      databaseProbe: createProbe({ status: 'up' }),
      logger: false,
    });
    app.get('/test/unhandled', async () => {
      throw new Error('sensitive infrastructure detail');
    });
    openApps.push(app);

    const response = await app.inject({ method: 'GET', url: '/test/unhandled' });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        correlationId: response.headers['x-correlation-id'],
        message: 'Ocorreu um erro inesperado.',
      },
    });
    expect(response.body).not.toContain('sensitive infrastructure detail');
  });

  it('closes the database dependency during application shutdown', async () => {
    const probe = createProbe({ status: 'up' });
    const app = await buildApi({
      config: testConfig,
      databaseProbe: probe,
      logger: false,
    });

    await app.close();

    expect(probe.close).toHaveBeenCalledOnce();
  });
});
