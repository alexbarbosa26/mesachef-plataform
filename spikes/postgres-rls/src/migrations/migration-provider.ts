import type { Migration, MigrationProvider } from 'kysely/migration';

import { createRlsSchemaMigration } from './001-create-rls-schema.js';

export class StaticRlsMigrationProvider implements MigrationProvider {
  public getMigrations(): Promise<Record<string, Migration>> {
    return Promise.resolve({
      '001_create_spike_rls_schema': createRlsSchemaMigration,
    });
  }
}
