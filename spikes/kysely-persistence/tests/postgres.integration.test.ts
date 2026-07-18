import { sql } from 'kysely';
import { expect } from 'vitest';

import { loadSpikeConfig, SpikeConfigurationError } from '../src/config.js';
import { createDatabase } from '../src/database/create-database.js';
import { definePersistenceContract } from './persistence-contract.js';

function localPostgresConfig(): ReturnType<typeof loadSpikeConfig> {
  const connectionString = process.env['SPIKE_POSTGRES_URL'];

  if (connectionString === undefined) {
    throw new SpikeConfigurationError(
      'SPIKE_POSTGRES_URL deve apontar para o PostgreSQL 14 local.',
    );
  }

  return loadSpikeConfig({
    SPIKE_DATABASE_PROVIDER: 'postgres',
    SPIKE_DATABASE_URL: connectionString,
  });
}

definePersistenceContract('PostgreSQL 14 local', {
  createDatabase: () => createDatabase(localPostgresConfig()),
  provider: 'postgres',
  async verifyDialectSchema(database): Promise<void> {
    const versionResult = await sql<{
      server_version_num: string;
    }>`select current_setting('server_version_num') as server_version_num`.execute(
      database,
    );
    expect(versionResult.rows[0]?.server_version_num.startsWith('14')).toBe(true);

    const columnResult = await sql<{
      column_name: string;
      data_type: string;
      numeric_precision: number | null;
      numeric_scale: number | null;
    }>`
      select
        column_name,
        data_type,
        numeric_precision::integer as numeric_precision,
        numeric_scale::integer as numeric_scale
      from information_schema.columns
      where table_schema = current_schema()
        and table_name = 'spike_resources'
    `.execute(database);
    const columns = new Map(
      columnResult.rows.map((column) => [column.column_name, column]),
    );

    expect(columns.get('id')?.data_type).toBe('uuid');
    expect(columns.get('company_id')?.data_type).toBe('uuid');
    expect(columns.get('created_at')?.data_type).toBe(
      'timestamp with time zone',
    );
    expect(columns.get('unit_price')).toMatchObject({
      data_type: 'numeric',
      numeric_precision: 24,
      numeric_scale: 4,
    });
  },
});
