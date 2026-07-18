import {
  appendFile,
  copyFile,
  mkdtemp,
  rm,
  stat,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createInfrastructureDatabase } from '../kysely/create-database.js';
import { CANONICALIZATION_VERSION, MIGRATION_TOOL_VERSION } from './constants.js';
import { FileMigrationArtifactProvider } from './file-migration-artifact-provider.js';
import { MigrationRunner } from './migration-runner.js';

const MIGRATION_NAME = '0001_create_migration_integrity';
const MIGRATION_FOLDER = resolve('packages/database/migrations');
const temporaryFolders: string[] = [];

function createSqliteRunner(migrationFolder = MIGRATION_FOLDER) {
  const database = createInfrastructureDatabase({
    connectionString: ':memory:',
    connectionTimeoutMs: 1_000,
    poolMax: 1,
    provider: 'sqlite',
  });
  const runner = new MigrationRunner({
    applicationVersion: '0.1.0-test',
    artifactProvider: new FileMigrationArtifactProvider({
      migrationFolder,
      provider: 'sqlite',
    }),
    clock: () => new Date('2030-01-02T03:04:05.678Z'),
    database,
  });

  return { database, runner };
}

afterEach(async () => {
  for (const folder of temporaryFolders.splice(0)) {
    await rm(folder, { force: true, recursive: true });
  }
});

describe('SQLite migration runner', () => {
  it('runs up and down while recording versioned integrity metadata', async () => {
    const { database, runner } = createSqliteRunner();

    try {
      await expect(runner.status()).resolves.toEqual([
        { name: MIGRATION_NAME, status: 'pending' },
      ]);
      await expect(runner.up()).resolves.toEqual([
        { direction: 'Up', name: MIGRATION_NAME, status: 'Success' },
      ]);

      const artifact = (
        await new FileMigrationArtifactProvider({
          migrationFolder: MIGRATION_FOLDER,
          provider: 'sqlite',
        }).loadArtifactDescriptors()
      )[0];
      const checksumRow = await database
        .selectFrom('mesachef_migration_checksum')
        .selectAll()
        .executeTakeFirstOrThrow();

      expect(checksumRow).toEqual({
        application_version: '0.1.0-test',
        applied_at: '2030-01-02T03:04:05.678Z',
        canonicalization_version: CANONICALIZATION_VERSION,
        checksum_sha256: artifact?.checksumSha256,
        migration_name: MIGRATION_NAME,
        migration_tool_version: MIGRATION_TOOL_VERSION,
      });
      await expect(runner.verifyIntegrity()).resolves.toBeUndefined();

      await expect(runner.down()).resolves.toEqual([
        { direction: 'Down', name: MIGRATION_NAME, status: 'Success' },
      ]);
      await expect(runner.status()).resolves.toEqual([
        { name: MIGRATION_NAME, status: 'pending' },
      ]);
      await expect(runner.up()).resolves.toEqual([
        { direction: 'Up', name: MIGRATION_NAME, status: 'Success' },
      ]);
    } finally {
      await database.destroy();
    }
  });

  it('fails closed when an applied migration artifact is edited', async () => {
    const temporaryFolder = await mkdtemp(
      join(resolve('packages/database'), '.tmp-migration-integrity-'),
    );
    temporaryFolders.push(temporaryFolder);
    const migrationFileName = `${MIGRATION_NAME}.mjs`;
    const copiedMigration = join(temporaryFolder, migrationFileName);
    const sideEffectFile = join(temporaryFolder, 'tampered-code-executed');

    await copyFile(join(MIGRATION_FOLDER, migrationFileName), copiedMigration);
    const { database, runner } = createSqliteRunner(temporaryFolder);

    try {
      await runner.up();
      await appendFile(
        copiedMigration,
        `\nawait import('node:fs/promises').then(({ writeFile }) => writeFile(new URL('./tampered-code-executed', import.meta.url), 'executed'));\n`,
        'utf8',
      );

      await expect(runner.status()).rejects.toMatchObject({
        code: 'MIGRATION_INTEGRITY_FAILED',
      });
      await expect(stat(sideEffectFile)).rejects.toMatchObject({
        code: 'ENOENT',
      });
    } finally {
      await database.destroy();
    }
  });
});
