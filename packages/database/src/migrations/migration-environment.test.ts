import { describe, expect, it } from 'vitest';

import { loadMigrationEnvironment } from './migration-environment.js';

function validEnvironment(): NodeJS.ProcessEnv {
  return {
    APP_VERSION: '0.1.0',
    DATABASE_CONNECTION_TIMEOUT_MS: '5000',
    DATABASE_MIGRATION_ALLOW_REMOTE: 'false',
    DATABASE_POOL_MAX: '2',
    DATABASE_PROVIDER: 'postgres',
    DATABASE_URL: 'postgresql://local-user:local-password@localhost:5432/local-db',
  };
}

describe('migration environment', () => {
  it('accepts an explicitly configured local PostgreSQL target', () => {
    expect(loadMigrationEnvironment(validEnvironment())).toMatchObject({
      applicationVersion: '0.1.0',
      database: {
        connectionTimeoutMs: 5_000,
        poolMax: 2,
        provider: 'postgres',
      },
    });
  });

  it('allows an auxiliary SQLite target', () => {
    expect(
      loadMigrationEnvironment({
        ...validEnvironment(),
        DATABASE_PROVIDER: 'sqlite',
        DATABASE_URL: ':memory:',
      }).database,
    ).toMatchObject({ connectionString: ':memory:', provider: 'sqlite' });
  });

  it('denies a remote PostgreSQL target without explicit opt-in', () => {
    const source = {
      ...validEnvironment(),
      DATABASE_URL:
        'postgresql://sensitive-user:sensitive-password@db.example.com:5432/mesachef',
    };

    expect(() => loadMigrationEnvironment(source)).toThrowError(
      expect.objectContaining({
        code: 'MIGRATION_CONFIGURATION_INVALID',
        message: 'Remote migration target requires explicit opt-in.',
      }),
    );

    try {
      loadMigrationEnvironment(source);
    } catch (error: unknown) {
      const renderedError = String(error);

      expect(renderedError).not.toContain('sensitive-user');
      expect(renderedError).not.toContain('sensitive-password');
      expect(renderedError).not.toContain('db.example.com');
    }
  });

  it('fails with a controlled error for an invalid pool size', () => {
    expect(() =>
      loadMigrationEnvironment({
        ...validEnvironment(),
        DATABASE_POOL_MAX: '0',
      }),
    ).toThrowError(
      expect.objectContaining({ code: 'MIGRATION_CONFIGURATION_INVALID' }),
    );
  });
});
