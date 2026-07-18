import { readFile, readdir } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import type { Migration } from 'kysely/migration';

import type { DatabaseProvider } from '../database-config.js';
import { canonicalizeMigrationV1 } from './canonical-migration.js';
import { MigrationError } from './migration-errors.js';

const MIGRATION_FILE_PATTERN = /^\d{4}_[a-z0-9]+(?:_[a-z0-9]+)*\.mjs$/u;

type MigrationFactory = (provider: DatabaseProvider) => Migration;

export type MigrationArtifact = Readonly<{
  checksumSha256: string;
  migration: Migration;
  name: string;
}>;

export type MigrationArtifactDescriptor = Readonly<{
  checksumSha256: string;
  name: string;
}>;

type MigrationSource = Readonly<{
  checksumSha256: string;
  filePath: string;
  name: string;
}>;

function migrationFactoryFromModule(module: unknown): MigrationFactory {
  if (
    typeof module !== 'object' ||
    module === null ||
    !('createMigration' in module) ||
    typeof module.createMigration !== 'function'
  ) {
    throw new MigrationError(
      'MIGRATION_SOURCE_INVALID',
      'Migration module must export createMigration.',
    );
  }

  return module.createMigration as MigrationFactory;
}

function assertMigration(value: Migration): void {
  if (typeof value.up !== 'function') {
    throw new MigrationError(
      'MIGRATION_SOURCE_INVALID',
      'Migration factory must return an up function.',
    );
  }

  if (value.down !== undefined && typeof value.down !== 'function') {
    throw new MigrationError(
      'MIGRATION_SOURCE_INVALID',
      'Migration down must be a function when provided.',
    );
  }
}

export class FileMigrationArtifactProvider {
  readonly #migrationFolder: string;
  readonly #provider: DatabaseProvider;

  public constructor(options: Readonly<{
    migrationFolder: string;
    provider: DatabaseProvider;
  }>) {
    this.#migrationFolder = resolve(options.migrationFolder);
    this.#provider = options.provider;
  }

  public async loadArtifactDescriptors(): Promise<
    readonly MigrationArtifactDescriptor[]
  > {
    return (await this.#loadSources()).map(
      ({ checksumSha256, name }) =>
        Object.freeze({ checksumSha256, name }),
    );
  }

  public async loadArtifacts(
    expectedDescriptors?: readonly MigrationArtifactDescriptor[],
  ): Promise<readonly MigrationArtifact[]> {
    const sources = await this.#loadSources();

    if (
      expectedDescriptors !== undefined &&
      !sameDescriptors(sources, expectedDescriptors)
    ) {
      throw new MigrationError(
        'MIGRATION_SOURCE_INVALID',
        'Migration source changed during integrity validation.',
      );
    }

    return Promise.all(
      sources.map(async (source) => {
        const moduleUrl = pathToFileURL(source.filePath);
        moduleUrl.searchParams.set('checksum', source.checksumSha256);

        let loadedModule: unknown;

        try {
          loadedModule = await import(moduleUrl.href);
        } catch (error: unknown) {
          throw new MigrationError(
            'MIGRATION_SOURCE_INVALID',
            'Migration module could not be loaded.',
            error,
          );
        }

        const migration = migrationFactoryFromModule(loadedModule)(
          this.#provider,
        );
        assertMigration(migration);

        return Object.freeze({
          checksumSha256: source.checksumSha256,
          migration,
          name: source.name,
        });
      }),
    );
  }

  async #loadSources(): Promise<readonly MigrationSource[]> {
    let entries;

    try {
      entries = await readdir(this.#migrationFolder, { withFileTypes: true });
    } catch (error: unknown) {
      throw new MigrationError(
        'MIGRATION_SOURCE_INVALID',
        'Migration folder could not be read.',
        error,
      );
    }

    const migrationFiles = entries
      .filter((entry) => entry.isFile() && extname(entry.name) === '.mjs')
      .map((entry) => entry.name);

    if (migrationFiles.some((fileName) => !MIGRATION_FILE_PATTERN.test(fileName))) {
      throw new MigrationError(
        'MIGRATION_SOURCE_INVALID',
        'Every migration .mjs file must use the versioned naming convention.',
      );
    }

    migrationFiles.sort();

    if (migrationFiles.length === 0) {
      throw new MigrationError(
        'MIGRATION_SOURCE_INVALID',
        'Migration folder must contain at least one versioned .mjs file.',
      );
    }

    return Promise.all(
      migrationFiles.map(async (fileName) => {
        const filePath = resolve(this.#migrationFolder, fileName);
        const source = await readFile(filePath);
        const canonical = canonicalizeMigrationV1(source);

        return Object.freeze({
          checksumSha256: canonical.checksumSha256,
          filePath,
          name: basename(fileName, extname(fileName)),
        });
      }),
    );
  }
}

function sameDescriptors(
  sources: readonly MigrationSource[],
  expected: readonly MigrationArtifactDescriptor[],
): boolean {
  return (
    sources.length === expected.length &&
    sources.every(
      (source, index) =>
        source.name === expected[index]?.name &&
        source.checksumSha256 === expected[index]?.checksumSha256,
    )
  );
}
