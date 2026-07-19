import type { Kysely } from 'kysely';
import { Migrator, type Migration, type MigrationProvider } from 'kysely/migration';

import type { MigrationInfrastructureDatabase } from '../kysely/database-schema.js';
import {
  CANONICALIZATION_VERSION,
  KYSELY_MIGRATION_LOCK_TABLE,
  KYSELY_MIGRATION_TABLE,
  MIGRATION_CHECKSUM_TABLE,
  MIGRATION_TOOL_VERSION,
} from './constants.js';
import type {
  FileMigrationArtifactProvider,
  MigrationArtifact,
  MigrationArtifactDescriptor,
} from './file-migration-artifact-provider.js';
import { MigrationError } from './migration-errors.js';

export type MigrationStatus = Readonly<{
  executedAt?: string;
  name: string;
  status: 'applied' | 'pending';
}>;

export type MigrationExecution = Readonly<{
  direction: 'Down' | 'Up';
  name: string;
  status: 'Error' | 'NotExecuted' | 'Success';
}>;

export type MigrationRunnerOptions = Readonly<{
  applicationVersion: string;
  artifactProvider: FileMigrationArtifactProvider;
  clock?: () => Date;
  database: Kysely<MigrationInfrastructureDatabase>;
}>;

class StaticMigrationProvider implements MigrationProvider {
  readonly #migrations: Record<string, Migration>;

  public constructor(migrations: Record<string, Migration>) {
    this.#migrations = migrations;
  }

  public getMigrations(): Promise<Record<string, Migration>> {
    return Promise.resolve(this.#migrations);
  }
}

function migrationProviderForArtifacts(
  artifacts: readonly MigrationArtifact[],
  options: Readonly<{
    applicationVersion: string;
    appliedAt: () => string;
  }>,
): MigrationProvider {
  const migrations = Object.fromEntries(
    artifacts.map((artifact) => {
      const up = async (database: Kysely<unknown>): Promise<void> => {
        await artifact.migration.up(database);
        const migrationDatabase =
          database as Kysely<MigrationInfrastructureDatabase>;

        await migrationDatabase
          .insertInto(MIGRATION_CHECKSUM_TABLE)
          .values({
            application_version: options.applicationVersion,
            applied_at: options.appliedAt(),
            canonicalization_version: CANONICALIZATION_VERSION,
            checksum_sha256: artifact.checksumSha256,
            migration_name: artifact.name,
            migration_tool_version: MIGRATION_TOOL_VERSION,
          })
          .executeTakeFirstOrThrow();
      };

      if (artifact.migration.down === undefined) {
        return [artifact.name, { up } satisfies Migration] as const;
      }

      const down = async (database: Kysely<unknown>): Promise<void> => {
        await artifact.migration.down?.(database);

        const migrationDatabase =
          database as Kysely<MigrationInfrastructureDatabase>;
        const checksumTableStillExists = (
          await migrationDatabase.introspection.getTables()
        ).some(({ name }) => name === MIGRATION_CHECKSUM_TABLE);

        if (checksumTableStillExists) {
          await migrationDatabase
            .deleteFrom(MIGRATION_CHECKSUM_TABLE)
            .where('migration_name', '=', artifact.name)
            .executeTakeFirstOrThrow();
        }
      };

      return [artifact.name, { down, up } satisfies Migration] as const;
    }),
  );

  return new StaticMigrationProvider(migrations);
}

function createMigrator(
  database: Kysely<MigrationInfrastructureDatabase>,
  provider: MigrationProvider,
): Migrator {
  return new Migrator({
    allowUnorderedMigrations: false,
    db: database,
    migrationLockTableName: KYSELY_MIGRATION_LOCK_TABLE,
    migrationTableName: KYSELY_MIGRATION_TABLE,
    provider,
  });
}

function integrityFailure(): MigrationError {
  return new MigrationError(
    'MIGRATION_INTEGRITY_FAILED',
    'Applied migration integrity validation failed.',
  );
}

export class MigrationRunner {
  readonly #applicationVersion: string;
  readonly #artifactProvider: FileMigrationArtifactProvider;
  readonly #clock: () => Date;
  readonly #database: Kysely<MigrationInfrastructureDatabase>;

  public constructor(options: MigrationRunnerOptions) {
    const applicationVersion = options.applicationVersion.trim();

    if (applicationVersion.length === 0 || applicationVersion.length > 64) {
      throw new MigrationError(
        'MIGRATION_CONFIGURATION_INVALID',
        'Application version must contain between 1 and 64 characters.',
      );
    }

    this.#applicationVersion = applicationVersion;
    this.#artifactProvider = options.artifactProvider;
    this.#clock = options.clock ?? (() => new Date());
    this.#database = options.database;
  }

  public async down(): Promise<readonly MigrationExecution[]> {
    return this.#execute('down');
  }

  public async status(): Promise<readonly MigrationStatus[]> {
    const artifacts = await this.#loadValidatedArtifacts();
    const migrationInfo = await createMigrator(
      this.#database,
      migrationProviderForArtifacts(artifacts, {
        applicationVersion: this.#applicationVersion,
        appliedAt: () => this.#clock().toISOString(),
      }),
    ).getMigrations();

    return migrationInfo.map((migration) =>
      migration.executedAt === undefined
        ? { name: migration.name, status: 'pending' }
        : {
            executedAt: migration.executedAt.toISOString(),
            name: migration.name,
            status: 'applied',
          },
    );
  }

  public async up(): Promise<readonly MigrationExecution[]> {
    return this.#execute('up');
  }

  public async verifyIntegrity(): Promise<void> {
    await this.#validateAppliedArtifacts(
      await this.#artifactProvider.loadArtifactDescriptors(),
    );
  }

  async #execute(direction: 'down' | 'up'): Promise<readonly MigrationExecution[]> {
    const artifacts = await this.#loadValidatedArtifacts();
    const provider = migrationProviderForArtifacts(artifacts, {
      applicationVersion: this.#applicationVersion,
      appliedAt: () => this.#clock().toISOString(),
    });
    const migrator = createMigrator(this.#database, provider);
    const result =
      direction === 'up'
        ? await migrator.migrateToLatest()
        : await migrator.migrateDown();

    if (result.error !== undefined) {
      throw new MigrationError(
        'MIGRATION_EXECUTION_FAILED',
        'Migration execution failed.',
        result.error,
      );
    }

    await this.#validateAppliedArtifacts(
      await this.#artifactProvider.loadArtifactDescriptors(),
    );

    return (result.results ?? []).map((migration) => ({
      direction: migration.direction,
      name: migration.migrationName,
      status: migration.status,
    }));
  }

  async #validateAppliedArtifacts(
    artifacts: readonly MigrationArtifactDescriptor[],
  ): Promise<void> {
    const tables = await this.#database.introspection.getTables({
      withInternalKyselyTables: true,
    });
    const tableNames = new Set(tables.map((table) => table.name));
    const hasKyselyHistory = tableNames.has(KYSELY_MIGRATION_TABLE);
    const hasChecksumHistory = tableNames.has(MIGRATION_CHECKSUM_TABLE);

    if (!hasKyselyHistory) {
      if (hasChecksumHistory) {
        throw integrityFailure();
      }
      return;
    }

    const appliedMigrations = await this.#database
      .selectFrom(KYSELY_MIGRATION_TABLE)
      .select(['name', 'timestamp'])
      .execute();

    if (appliedMigrations.length === 0) {
      if (hasChecksumHistory) {
        throw integrityFailure();
      }
      return;
    }

    if (!hasChecksumHistory) {
      throw integrityFailure();
    }

    const checksumRows = await this.#database
      .selectFrom(MIGRATION_CHECKSUM_TABLE)
      .selectAll()
      .execute();

    if (checksumRows.length !== appliedMigrations.length) {
      throw integrityFailure();
    }

    const artifactsByName = new Map(
      artifacts.map((artifact) => [artifact.name, artifact]),
    );
    const checksumsByName = new Map(
      checksumRows.map((row) => [row.migration_name, row]),
    );

    for (const appliedMigration of appliedMigrations) {
      const artifact = artifactsByName.get(appliedMigration.name);
      const checksumRow = checksumsByName.get(appliedMigration.name);

      if (
        artifact === undefined ||
        checksumRow === undefined ||
        checksumRow.checksum_sha256 !== artifact.checksumSha256 ||
        checksumRow.canonicalization_version !== CANONICALIZATION_VERSION ||
        checksumRow.application_version.trim().length === 0 ||
        checksumRow.migration_tool_version.trim().length === 0
      ) {
        throw integrityFailure();
      }

      const appliedAt =
        checksumRow.applied_at instanceof Date
          ? checksumRow.applied_at
          : new Date(checksumRow.applied_at);

      if (!Number.isFinite(appliedAt.getTime())) {
        throw integrityFailure();
      }
    }
  }

  async #loadValidatedArtifacts(): Promise<readonly MigrationArtifact[]> {
    const descriptors =
      await this.#artifactProvider.loadArtifactDescriptors();

    await this.#validateAppliedArtifacts(descriptors);

    return this.#artifactProvider.loadArtifacts(descriptors);
  }
}
