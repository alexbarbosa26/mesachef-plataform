import { sql } from 'kysely';
import { expect } from 'vitest';

import { createDatabase } from '../src/database/create-database.js';
import type { SpikeDatabase } from '../src/database/schema.js';
import { definePersistenceContract } from './persistence-contract.js';

definePersistenceContract('SQLite em memória', {
  createDatabase: () =>
    createDatabase({ databasePath: ':memory:', provider: 'sqlite' }),
  provider: 'sqlite',
  async verifyDialectSchema(database): Promise<void> {
    const versionResult = await sql<{
      sqlite_version: string;
    }>`select sqlite_version() as sqlite_version`.execute(database);
    expect(versionResult.rows[0]?.sqlite_version).toMatch(/^3\.\d+\.\d+$/u);

    const resourceColumns = await sql<{
      name: string;
      type: string;
    }>`pragma table_info('spike_resources')`.execute(
      database as typeof database & { readonly __schema: SpikeDatabase },
    );
    const typeByColumn = new Map(
      resourceColumns.rows.map((column) => [column.name, column.type]),
    );

    expect(typeByColumn.get('id')?.toUpperCase()).toBe('TEXT');
    expect(typeByColumn.get('company_id')?.toUpperCase()).toBe('TEXT');
    expect(typeByColumn.get('unit_price')?.toUpperCase()).toBe('TEXT');
    expect(typeByColumn.get('created_at')?.toUpperCase()).toBe('TEXT');
  },
});
