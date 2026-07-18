import { sql } from 'kysely';
import type { Kysely } from 'kysely';

import type {
  DatabaseConnectionConfig,
  DatabaseProvider,
} from './database-config.js';
import { createInfrastructureDatabase } from './kysely/create-database.js';
import type { MigrationInfrastructureDatabase } from './kysely/database-schema.js';

export type DatabaseHealthCheck =
  | Readonly<{ status: 'up' }>
  | Readonly<{ error: unknown; status: 'down' }>;

export interface DatabaseHealthProbe {
  readonly provider: DatabaseProvider;
  check(): Promise<DatabaseHealthCheck>;
  close(): Promise<void>;
}

export type DatabaseHealthProbeConfig = DatabaseConnectionConfig;

class KyselyDatabaseHealthProbe implements DatabaseHealthProbe {
  public readonly provider: DatabaseProvider;
  readonly #database: Kysely<MigrationInfrastructureDatabase>;

  public constructor(config: DatabaseHealthProbeConfig) {
    this.provider = config.provider;
    this.#database = createInfrastructureDatabase(config);
  }

  public async check(): Promise<DatabaseHealthCheck> {
    try {
      await sql`select 1`.execute(this.#database);
      return { status: 'up' };
    } catch (error: unknown) {
      return { error, status: 'down' };
    }
  }

  public async close(): Promise<void> {
    await this.#database.destroy();
  }
}

export function createDatabaseHealthProbe(
  config: DatabaseHealthProbeConfig,
): DatabaseHealthProbe {
  return new KyselyDatabaseHealthProbe(config);
}
