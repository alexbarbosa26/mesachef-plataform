import type { Migration, MigrationProvider } from 'kysely/migration';

import { createExperimentalSchemaMigration } from './001-create-experimental-schema.js';
import type { SpikeMigrationProvider } from './001-create-experimental-schema.js';

export class StaticSpikeMigrationProvider implements MigrationProvider {
  readonly #provider: SpikeMigrationProvider;

  public constructor(provider: SpikeMigrationProvider) {
    this.#provider = provider;
  }

  public getMigrations(): Promise<Record<string, Migration>> {
    return Promise.resolve({
      '001_create_experimental_schema': createExperimentalSchemaMigration(
        this.#provider,
      ),
    });
  }
}
