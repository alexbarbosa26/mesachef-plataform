import type { Kysely } from 'kysely';
import { Migrator } from 'kysely/migration';

import type { SpikeDatabase } from '../database/schema.js';
import type { SpikeMigrationProvider } from './001-create-experimental-schema.js';
import { StaticSpikeMigrationProvider } from './migration-provider.js';

const MIGRATION_TABLE = 'spike_kysely_migration';
const MIGRATION_LOCK_TABLE = 'spike_kysely_migration_lock';

export class SpikeMigrationError extends Error {
  public readonly code = 'SPIKE_MIGRATION_FAILED';

  public constructor(message: string, cause: unknown) {
    super(message, { cause });
    this.name = 'SpikeMigrationError';
  }
}

function createMigrator(
  database: Kysely<SpikeDatabase>,
  provider: SpikeMigrationProvider,
): Migrator {
  return new Migrator({
    allowUnorderedMigrations: false,
    db: database,
    migrationLockTableName: MIGRATION_LOCK_TABLE,
    migrationTableName: MIGRATION_TABLE,
    provider: new StaticSpikeMigrationProvider(provider),
  });
}

export async function migrateOneStepDown(
  database: Kysely<SpikeDatabase>,
  provider: SpikeMigrationProvider,
): Promise<void> {
  const migrationResult = await createMigrator(database, provider).migrateDown();

  if (migrationResult.error !== undefined) {
    throw new SpikeMigrationError(
      'Não foi possível reverter a migration experimental.',
      migrationResult.error,
    );
  }
}

export async function migrateToLatest(
  database: Kysely<SpikeDatabase>,
  provider: SpikeMigrationProvider,
): Promise<void> {
  const migrationResult = await createMigrator(
    database,
    provider,
  ).migrateToLatest();

  if (migrationResult.error !== undefined) {
    throw new SpikeMigrationError(
      'Não foi possível aplicar a migration experimental.',
      migrationResult.error,
    );
  }
}
