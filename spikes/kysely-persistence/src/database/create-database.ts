import BetterSqlite3 from 'better-sqlite3';
import { Kysely, PostgresDialect, SqliteDialect } from 'kysely';
import { Pool } from 'pg';

import type { SpikeConfig } from '../config.js';
import type { SpikeDatabase } from './schema.js';

export function createDatabase(config: SpikeConfig): Kysely<SpikeDatabase> {
  if (config.provider === 'postgres') {
    return new Kysely<SpikeDatabase>({
      dialect: new PostgresDialect({
        pool: new Pool({
          allowExitOnIdle: true,
          connectionString: config.connectionString,
          connectionTimeoutMillis: 5_000,
          idleTimeoutMillis: 1_000,
          max: 4,
        }),
      }),
    });
  }

  const sqlite = new BetterSqlite3(config.databasePath);
  sqlite.pragma('foreign_keys = ON');

  return new Kysely<SpikeDatabase>({
    dialect: new SqliteDialect({ database: sqlite }),
  });
}

