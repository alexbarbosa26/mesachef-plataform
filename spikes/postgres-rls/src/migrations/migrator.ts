import { sql, type Kysely } from 'kysely';
import { Migrator } from 'kysely/migration';

import type { SpikeRlsDatabase } from '../database/schema.js';
import { StaticRlsMigrationProvider } from './migration-provider.js';

const MIGRATION_TABLE = 'spike_rls_migration';
const MIGRATION_LOCK_TABLE = 'spike_rls_migration_lock';

export class RlsSpikeMigrationError extends Error {
  public readonly code = 'SPIKE_RLS_MIGRATION_FAILED';

  public constructor(message: string) {
    super(message);
    this.name = 'RlsSpikeMigrationError';
  }
}

function createMigrator(database: Kysely<SpikeRlsDatabase>): Migrator {
  return new Migrator({
    allowUnorderedMigrations: false,
    db: database,
    migrationLockTableName: MIGRATION_LOCK_TABLE,
    migrationTableName: MIGRATION_TABLE,
    provider: new StaticRlsMigrationProvider(),
  });
}

export async function migrateRlsSchemaUp(
  database: Kysely<SpikeRlsDatabase>,
): Promise<void> {
  const result = await createMigrator(database).migrateToLatest();

  if (result.error !== undefined) {
    throw new RlsSpikeMigrationError(
      'Não foi possível aplicar a migration RLS experimental.',
    );
  }
}

export async function migrateRlsSchemaDown(
  database: Kysely<SpikeRlsDatabase>,
): Promise<void> {
  const result = await createMigrator(database).migrateDown();

  if (result.error !== undefined) {
    throw new RlsSpikeMigrationError(
      'Não foi possível reverter a migration RLS experimental.',
    );
  }
}

export async function dropAllExperimentalTables(
  database: Kysely<SpikeRlsDatabase>,
): Promise<void> {
  await sql.raw(`
    drop table if exists
      spike_rls_audit_events,
      spike_rls_resources,
      spike_rls_companies,
      ${MIGRATION_TABLE},
      ${MIGRATION_LOCK_TABLE}
    cascade
  `).execute(database);
}

export async function assertNoExperimentalTables(
  database: Kysely<SpikeRlsDatabase>,
): Promise<void> {
  const result = await sql<{ table_count: number }>`
    select count(*)::integer as table_count
    from information_schema.tables
    where table_schema = current_schema()
      and table_name like 'spike_rls_%'
  `.execute(database);

  if (result.rows[0]?.table_count !== 0) {
    throw new RlsSpikeMigrationError(
      'A limpeza deixou tabelas experimentais no PostgreSQL local.',
    );
  }
}
