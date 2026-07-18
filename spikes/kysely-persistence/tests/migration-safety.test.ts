import { Migrator } from 'kysely/migration';
import { describe, expect, it } from 'vitest';

import { createDatabase } from '../src/database/create-database.js';
import { createExperimentalSchemaMigration } from '../src/migrations/001-create-experimental-schema.js';
import {
  migrateOneStepDown,
  migrateToLatest,
} from '../src/migrations/migrator.js';

const MIGRATOR_OPTIONS = {
  migrationLockTableName: 'spike_kysely_migration_lock',
  migrationTableName: 'spike_kysely_migration',
} as const;

describe('limites de segurança do migrator Kysely', () => {
  it('detecta migration fora de ordem, mas não alteração de conteúdo já aplicado', async () => {
    const database = createDatabase({
      databasePath: ':memory:',
      provider: 'sqlite',
    });

    try {
      await migrateToLatest(database, 'sqlite');

      let changedMigrationExecuted = false;
      const changedContentResult = await new Migrator({
        ...MIGRATOR_OPTIONS,
        db: database,
        provider: {
          getMigrations: () =>
            Promise.resolve({
              '001_create_experimental_schema': {
                up: () => {
                  changedMigrationExecuted = true;
                  return Promise.resolve();
                },
              },
            }),
        },
      }).migrateToLatest();

      expect(changedContentResult.error).toBeUndefined();
      expect(changedMigrationExecuted).toBe(false);

      const outOfOrderResult = await new Migrator({
        ...MIGRATOR_OPTIONS,
        db: database,
        provider: {
          getMigrations: () =>
            Promise.resolve({
              '000_inserted_after_001_was_applied': {
                up: () => Promise.resolve(),
              },
              '001_create_experimental_schema':
                createExperimentalSchemaMigration('sqlite'),
            }),
        },
      }).migrateToLatest();

      expect(outOfOrderResult.error).toBeDefined();
    } finally {
      await migrateOneStepDown(database, 'sqlite');
      await database.destroy();
    }
  });
});
