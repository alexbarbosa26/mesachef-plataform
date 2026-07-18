import { describe, expect, it } from 'vitest';

import {
  EnvironmentConfigurationError,
  loadApplicationConfig,
} from './environment.js';

const validEnvironment: NodeJS.ProcessEnv = {
  APP_ENV: 'test',
  APP_HOST: '127.0.0.1',
  APP_PORT: '3000',
  APP_URL: 'http://localhost:5173',
  CORS_ALLOWED_ORIGINS: 'http://localhost:5173,http://127.0.0.1:5173',
  DATABASE_CONNECTION_TIMEOUT_MS: '1000',
  DATABASE_POOL_MAX: '2',
  DATABASE_PROVIDER: 'sqlite',
  DATABASE_URL: ':memory:',
  LOG_LEVEL: 'silent',
  OPENAPI_ENABLED: 'false',
};

describe('loadApplicationConfig', () => {
  it('normalizes a valid environment', () => {
    const config = loadApplicationConfig(validEnvironment);

    expect(config).toMatchObject({
      app: {
        environment: 'test',
        host: '127.0.0.1',
        port: 3000,
      },
      database: {
        connectionString: ':memory:',
        poolMax: 2,
        provider: 'sqlite',
      },
      openApiEnabled: false,
    });
    expect(config.cors.allowedOrigins).toEqual(
      new Set(['http://localhost:5173', 'http://127.0.0.1:5173']),
    );
  });

  it('fails before startup when a mandatory variable is absent', () => {
    const environmentWithoutPort = { ...validEnvironment };
    delete environmentWithoutPort['APP_PORT'];

    expect(() => loadApplicationConfig(environmentWithoutPort)).toThrow(
      EnvironmentConfigurationError,
    );

    try {
      loadApplicationConfig(environmentWithoutPort);
    } catch (error: unknown) {
      expect(error).toMatchObject({ invalidFields: ['APP_PORT'] });
    }
  });

  it('rejects a PostgreSQL URL for the SQLite provider', () => {
    expect(() =>
      loadApplicationConfig({
        ...validEnvironment,
        DATABASE_URL: 'postgresql://user:password@localhost/database',
      }),
    ).toThrow('Invalid environment fields: DATABASE_URL.');
  });
});
