import {
  type DatabaseConnectionConfig,
  type DatabaseProvider,
  validateDatabaseConnectionConfig,
} from '../database-config.js';
import { MigrationError } from './migration-errors.js';

const LOCAL_POSTGRES_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

export type MigrationEnvironmentConfig = Readonly<{
  applicationVersion: string;
  database: DatabaseConnectionConfig;
}>;

function requiredValue(
  source: NodeJS.ProcessEnv,
  field: string,
): string {
  const value = source[field]?.trim();

  if (value === undefined || value.length === 0) {
    throw new MigrationError(
      'MIGRATION_CONFIGURATION_INVALID',
      `Migration configuration field ${field} is required.`,
    );
  }

  return value;
}

function parseProvider(value: string): DatabaseProvider {
  if (value === 'postgres' || value === 'sqlite') {
    return value;
  }

  throw new MigrationError(
    'MIGRATION_CONFIGURATION_INVALID',
    'DATABASE_PROVIDER must be postgres or sqlite.',
  );
}

function parseInteger(value: string, field: string): number {
  if (!/^\d+$/u.test(value)) {
    throw new MigrationError(
      'MIGRATION_CONFIGURATION_INVALID',
      `Migration configuration field ${field} must be an integer.`,
    );
  }

  return Number.parseInt(value, 10);
}

function assertAllowedTarget(
  database: DatabaseConnectionConfig,
  allowRemote: boolean,
): void {
  if (database.provider !== 'postgres' || allowRemote) {
    return;
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(database.connectionString);
  } catch (error: unknown) {
    throw new MigrationError(
      'MIGRATION_CONFIGURATION_INVALID',
      'DATABASE_URL must be a valid PostgreSQL URL.',
      error,
    );
  }

  const hostname = parsedUrl.hostname.replace(/^\[|\]$/gu, '');

  if (!LOCAL_POSTGRES_HOSTS.has(hostname)) {
    throw new MigrationError(
      'MIGRATION_CONFIGURATION_INVALID',
      'Remote migration target requires explicit opt-in.',
    );
  }
}

export function loadMigrationEnvironment(
  source: NodeJS.ProcessEnv,
): MigrationEnvironmentConfig {
  const provider = parseProvider(requiredValue(source, 'DATABASE_PROVIDER'));
  const database = Object.freeze({
    connectionString: requiredValue(source, 'DATABASE_URL'),
    connectionTimeoutMs: parseInteger(
      requiredValue(source, 'DATABASE_CONNECTION_TIMEOUT_MS'),
      'DATABASE_CONNECTION_TIMEOUT_MS',
    ),
    poolMax: parseInteger(
      requiredValue(source, 'DATABASE_POOL_MAX'),
      'DATABASE_POOL_MAX',
    ),
    provider,
  });

  try {
    validateDatabaseConnectionConfig(database);
  } catch (error: unknown) {
    throw new MigrationError(
      'MIGRATION_CONFIGURATION_INVALID',
      'Database configuration is invalid.',
      error,
    );
  }

  const allowRemoteValue =
    source['DATABASE_MIGRATION_ALLOW_REMOTE']?.trim() ?? 'false';

  if (allowRemoteValue !== 'false' && allowRemoteValue !== 'true') {
    throw new MigrationError(
      'MIGRATION_CONFIGURATION_INVALID',
      'DATABASE_MIGRATION_ALLOW_REMOTE must be true or false.',
    );
  }

  assertAllowedTarget(database, allowRemoteValue === 'true');

  return Object.freeze({
    applicationVersion: requiredValue(source, 'APP_VERSION'),
    database,
  });
}
