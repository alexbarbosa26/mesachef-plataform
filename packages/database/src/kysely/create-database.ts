import BetterSqlite3 from 'better-sqlite3';
import { Kysely, PostgresDialect, SqliteDialect } from 'kysely';
import { Pool, TypeOverrides, types } from 'pg';

import {
  type DatabaseConnectionConfig,
  validateDatabaseConnectionConfig,
} from '../database-config.js';
import type { MigrationInfrastructureDatabase } from './database-schema.js';

function createExactPostgresTypes(): TypeOverrides {
  const exactTypes = new TypeOverrides(types);

  exactTypes.setTypeParser(types.builtins.NUMERIC, (value) => value);

  return exactTypes;
}

export function createInfrastructureDatabase(
  config: DatabaseConnectionConfig,
): Kysely<MigrationInfrastructureDatabase> {
  validateDatabaseConnectionConfig(config);

  if (config.provider === 'postgres') {
    return new Kysely<MigrationInfrastructureDatabase>({
      dialect: new PostgresDialect({
        pool: new Pool({
          allowExitOnIdle: true,
          application_name: 'mesachef-platform',
          connectionString: config.connectionString,
          connectionTimeoutMillis: config.connectionTimeoutMs,
          idleTimeoutMillis: 10_000,
          max: config.poolMax,
          types: createExactPostgresTypes(),
        }),
      }),
    });
  }

  const sqliteDatabase = new BetterSqlite3(config.connectionString);
  sqliteDatabase.pragma('foreign_keys = ON');

  return new Kysely<MigrationInfrastructureDatabase>({
    dialect: new SqliteDialect({ database: sqliteDatabase }),
  });
}
