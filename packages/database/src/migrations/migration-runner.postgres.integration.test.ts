import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { sql } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { DatabaseConnectionConfig } from '../database-config.js';
import { createInfrastructureDatabase } from '../kysely/create-database.js';
import { FileMigrationArtifactProvider } from './file-migration-artifact-provider.js';
import { MigrationRunner } from './migration-runner.js';

const LOCAL_POSTGRES_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);
const MIGRATION_FOLDER = resolve('packages/database/migrations');
const MIGRATION_NAME = '0001_create_migration_integrity';

function localPostgresConfiguration(): DatabaseConnectionConfig {
  const environmentPath = resolve('.env');

  if (existsSync(environmentPath)) {
    process.loadEnvFile(environmentPath);
  }

  const connectionString = process.env['DATABASE_URL']?.trim();

  if (connectionString === undefined || connectionString.length === 0) {
    throw new Error('Local PostgreSQL test configuration is unavailable.');
  }

  const hostname = new URL(connectionString).hostname.replace(/^\[|\]$/gu, '');

  if (!LOCAL_POSTGRES_HOSTS.has(hostname)) {
    throw new Error('PostgreSQL integration tests require a local target.');
  }

  return {
    connectionString,
    connectionTimeoutMs: 5_000,
    poolMax: 2,
    provider: 'postgres',
  };
}

describe.sequential('PostgreSQL 14 migration infrastructure', () => {
  const database = createInfrastructureDatabase(localPostgresConfiguration());

  beforeAll(async () => {
    await sql`select 1`.execute(database);
  });

  afterAll(async () => {
    await database.destroy();
  });

  it('uses PostgreSQL 14 and never parses numeric as JavaScript number', async () => {
    const versionResult = await sql<{ server_version: string }>`show server_version`.execute(
      database,
    );
    const numericResult = await sql<{ exact_numeric: unknown }>`
      select 9007199254740993.1234::numeric(24,4) as exact_numeric
    `.execute(database);

    expect(versionResult.rows[0]?.server_version).toMatch(/^14\./u);
    expect(numericResult.rows[0]?.exact_numeric).toBe(
      '9007199254740993.1234',
    );
    expect(typeof numericResult.rows[0]?.exact_numeric).toBe('string');
  });

  it('validates up, down and checksum metadata without persisting test schema', async () => {
    const rollbackSignal = new Error('ROLLBACK_POSTGRES_MIGRATION_TEST');

    try {
      await database.transaction().execute(async (transaction) => {
        const runner = new MigrationRunner({
          applicationVersion: '0.1.0-test',
          artifactProvider: new FileMigrationArtifactProvider({
            migrationFolder: MIGRATION_FOLDER,
            provider: 'postgres',
          }),
          clock: () => new Date('2030-01-02T03:04:05.678Z'),
          database: transaction,
        });

        await expect(runner.up()).resolves.toEqual([
          { direction: 'Up', name: MIGRATION_NAME, status: 'Success' },
        ]);
        const checksumRow = await transaction
          .selectFrom('mesachef_migration_checksum')
          .selectAll()
          .executeTakeFirstOrThrow();

        expect(checksumRow.applied_at).toBeInstanceOf(Date);
        expect(checksumRow).toMatchObject({
          application_version: '0.1.0-test',
          canonicalization_version: 'v1',
          migration_name: MIGRATION_NAME,
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

        throw rollbackSignal;
      });
      throw new Error('PostgreSQL migration test did not roll back.');
    } catch (error: unknown) {
      expect(error).toBe(rollbackSignal);
    }

    const tableNames = new Set(
      (await database.introspection.getTables({
        withInternalKyselyTables: true,
      })).map((table) => table.name),
    );

    expect(tableNames.has('mesachef_migration_checksum')).toBe(false);
    expect(tableNames.has('mesachef_kysely_migration')).toBe(false);
    expect(tableNames.has('mesachef_kysely_migration_lock')).toBe(false);
  });
});
