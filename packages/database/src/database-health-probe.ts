import { DatabaseSync } from 'node:sqlite';

import { Pool } from 'pg';

export type DatabaseProvider = 'postgres' | 'sqlite';

export type DatabaseHealthCheck =
  | Readonly<{ status: 'up' }>
  | Readonly<{ error: unknown; status: 'down' }>;

export interface DatabaseHealthProbe {
  readonly provider: DatabaseProvider;
  check(): Promise<DatabaseHealthCheck>;
  close(): Promise<void>;
}

export type DatabaseHealthProbeConfig = Readonly<{
  connectionString: string;
  connectionTimeoutMs: number;
  provider: DatabaseProvider;
}>;

class PostgresDatabaseHealthProbe implements DatabaseHealthProbe {
  public readonly provider = 'postgres' as const;
  readonly #pool: Pool;

  public constructor(config: DatabaseHealthProbeConfig) {
    this.#pool = new Pool({
      allowExitOnIdle: true,
      connectionString: config.connectionString,
      connectionTimeoutMillis: config.connectionTimeoutMs,
      idleTimeoutMillis: 10_000,
      max: 2,
    });
  }

  public async check(): Promise<DatabaseHealthCheck> {
    try {
      await this.#pool.query('SELECT 1');
      return { status: 'up' };
    } catch (error: unknown) {
      return { error, status: 'down' };
    }
  }

  public async close(): Promise<void> {
    await this.#pool.end();
  }
}

class SqliteDatabaseHealthProbe implements DatabaseHealthProbe {
  public readonly provider = 'sqlite' as const;
  readonly #database: DatabaseSync;
  #closed = false;

  public constructor(config: DatabaseHealthProbeConfig) {
    this.#database = new DatabaseSync(config.connectionString);
  }

  public async check(): Promise<DatabaseHealthCheck> {
    try {
      this.#database.prepare('SELECT 1').get();
      return { status: 'up' };
    } catch (error: unknown) {
      return { error, status: 'down' };
    }
  }

  public async close(): Promise<void> {
    if (!this.#closed) {
      this.#database.close();
      this.#closed = true;
    }
  }
}

export function createDatabaseHealthProbe(
  config: DatabaseHealthProbeConfig,
): DatabaseHealthProbe {
  switch (config.provider) {
    case 'postgres':
      return new PostgresDatabaseHealthProbe(config);
    case 'sqlite':
      return new SqliteDatabaseHealthProbe(config);
  }
}
