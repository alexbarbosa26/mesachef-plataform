import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import type { SpikeRlsDatabase } from './schema.js';

export type PostgresDatabaseHandle = Readonly<{
  database: Kysely<SpikeRlsDatabase>;
  pool: Pool;
}>;

export function createPostgresDatabase(
  connectionString: string,
  options: Readonly<{
    applicationName: string;
    maxConnections?: number;
  }>,
): PostgresDatabaseHandle {
  const pool = new Pool({
    allowExitOnIdle: true,
    application_name: options.applicationName,
    connectionString,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 1_000,
    max: options.maxConnections ?? 4,
  });

  return {
    database: new Kysely<SpikeRlsDatabase>({
      dialect: new PostgresDialect({ pool }),
    }),
    pool,
  };
}

export async function destroyPostgresDatabase(
  handle: PostgresDatabaseHandle | undefined,
): Promise<void> {
  if (handle !== undefined) {
    await handle.database.destroy();
  }
}
