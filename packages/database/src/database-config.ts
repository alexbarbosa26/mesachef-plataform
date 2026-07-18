export type DatabaseProvider = 'postgres' | 'sqlite';

export type DatabaseConnectionConfig = Readonly<{
  connectionString: string;
  connectionTimeoutMs: number;
  poolMax: number;
  provider: DatabaseProvider;
}>;

export class DatabaseConfigurationError extends Error {
  public readonly code = 'DATABASE_INVALID_CONFIGURATION';
  public readonly invalidFields: readonly string[];

  public constructor(invalidFields: readonly string[]) {
    const uniqueFields = [...new Set(invalidFields)].sort();
    super(`Invalid database configuration fields: ${uniqueFields.join(', ')}.`);
    this.invalidFields = uniqueFields;
    this.name = 'DatabaseConfigurationError';
  }
}

export function validateDatabaseConnectionConfig(
  config: DatabaseConnectionConfig,
): void {
  const invalidFields: string[] = [];
  const trimmedConnectionString = config.connectionString.trim();
  const isPostgresUrl = /^(?:postgres|postgresql):\/\//u.test(
    trimmedConnectionString,
  );

  if (trimmedConnectionString.length === 0) {
    invalidFields.push('connectionString');
  }

  if (config.provider === 'postgres' && !isPostgresUrl) {
    invalidFields.push('connectionString');
  }

  if (config.provider === 'sqlite' && isPostgresUrl) {
    invalidFields.push('connectionString');
  }

  if (
    !Number.isInteger(config.connectionTimeoutMs) ||
    config.connectionTimeoutMs < 100 ||
    config.connectionTimeoutMs > 30_000
  ) {
    invalidFields.push('connectionTimeoutMs');
  }

  if (
    !Number.isInteger(config.poolMax) ||
    config.poolMax < 1 ||
    config.poolMax > 50
  ) {
    invalidFields.push('poolMax');
  }

  if (invalidFields.length > 0) {
    throw new DatabaseConfigurationError(invalidFields);
  }
}
