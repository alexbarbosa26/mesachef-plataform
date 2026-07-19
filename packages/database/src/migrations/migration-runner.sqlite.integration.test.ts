import {
  appendFile,
  copyFile,
  mkdtemp,
  rm,
  stat,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { sql, type Kysely } from 'kysely';
import { afterEach, describe, expect, it } from 'vitest';

import { createInfrastructureDatabase } from '../kysely/create-database.js';
import type { MigrationInfrastructureDatabase } from '../kysely/database-schema.js';
import { CANONICALIZATION_VERSION, MIGRATION_TOOL_VERSION } from './constants.js';
import { FileMigrationArtifactProvider } from './file-migration-artifact-provider.js';
import { MigrationRunner } from './migration-runner.js';

const MIGRATION_FOLDER = resolve('packages/database/migrations');
const MIGRATION_NAMES = [
  '0001_create_migration_integrity',
  '0002_create_identity_tenancy_namespaces',
  '0003_create_identity_users',
  '0004_create_identity_password_credentials',
  '0005_create_tenancy_companies',
  '0006_create_tenancy_memberships',
] as const;
const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';
const COMPANY_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const COMPANY_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const MEMBERSHIP_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const MEMBERSHIP_B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const CREATED_AT = '2030-01-02T03:04:05.678Z';
const UPDATED_AT = '2030-01-02T03:04:06.678Z';
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
    clock: () => new Date(CREATED_AT),
    database,
  });

  return { database, runner };
}

function pendingStatuses() {
  return MIGRATION_NAMES.map((name) => ({ name, status: 'pending' as const }));
}

function upExecutions(names: readonly string[] = MIGRATION_NAMES) {
  return names.map((name) => ({
    direction: 'Up' as const,
    name,
    status: 'Success' as const,
  }));
}

async function insertUser(
  database: Kysely<MigrationInfrastructureDatabase>,
  id: string,
  normalizedEmail: string,
): Promise<void> {
  await sql`
    insert into identity_users (
      id,
      email_original,
      email_normalized,
      display_name,
      status,
      authorization_version,
      created_at,
      updated_at,
      blocked_at,
      blocked_reason
    ) values (
      ${id},
      ${normalizedEmail},
      ${normalizedEmail},
      'Test User',
      'ACTIVE',
      1,
      ${CREATED_AT},
      ${UPDATED_AT},
      null,
      null
    )
  `.execute(database);
}

async function insertCompany(
  database: Kysely<MigrationInfrastructureDatabase>,
  id: string,
  name: string,
): Promise<void> {
  await sql`
    insert into tenancy_companies (
      id,
      name,
      status,
      authorization_version,
      created_at,
      updated_at,
      blocked_at,
      blocked_reason
    ) values (
      ${id},
      ${name},
      'ACTIVE',
      1,
      ${CREATED_AT},
      ${UPDATED_AT},
      null,
      null
    )
  `.execute(database);
}

async function insertCredential(
  database: Kysely<MigrationInfrastructureDatabase>,
  options: Readonly<{
    changedAt?: string;
    hash?: string;
    hashAlgorithm?: string;
    parametersVersion?: number;
    requiresChange?: number;
    updatedAt?: string;
    userId: string;
  }>,
): Promise<void> {
  await sql`
    insert into identity_password_credentials (
      user_id,
      password_hash,
      hash_algorithm,
      hash_parameters_version,
      password_changed_at,
      requires_password_change,
      created_at,
      updated_at
    ) values (
      ${options.userId},
      ${options.hash ?? 'not-a-real-password-hash'},
      ${options.hashAlgorithm ?? 'test-algorithm'},
      ${options.parametersVersion ?? 1},
      ${options.changedAt ?? UPDATED_AT},
      ${options.requiresChange ?? 0},
      ${CREATED_AT},
      ${options.updatedAt ?? UPDATED_AT}
    )
  `.execute(database);
}

afterEach(async () => {
  for (const folder of temporaryFolders.splice(0)) {
    await rm(folder, { force: true, recursive: true });
  }
});

describe('SQLite identity and tenancy migrations', () => {
  it('migrates an empty database, records checksums and is idempotent', async () => {
    const { database, runner } = createSqliteRunner();

    try {
      await expect(runner.status()).resolves.toEqual(pendingStatuses());
      await expect(runner.up()).resolves.toEqual(upExecutions());
      await expect(runner.up()).resolves.toEqual([]);
      await expect(runner.verifyIntegrity()).resolves.toBeUndefined();

      const artifacts = await new FileMigrationArtifactProvider({
        migrationFolder: MIGRATION_FOLDER,
        provider: 'sqlite',
      }).loadArtifactDescriptors();
      const checksumRows = await database
        .selectFrom('mesachef_migration_checksum')
        .selectAll()
        .orderBy('migration_name')
        .execute();

      expect(checksumRows).toHaveLength(MIGRATION_NAMES.length);
      expect(checksumRows).toEqual(
        artifacts.map((artifact) => ({
          application_version: '0.1.0-test',
          applied_at: CREATED_AT,
          canonicalization_version: CANONICALIZATION_VERSION,
          checksum_sha256: artifact.checksumSha256,
          migration_name: artifact.name,
          migration_tool_version: MIGRATION_TOOL_VERSION,
        })),
      );

      const tableRows = await sql<{ name: string }>`
        select name
        from sqlite_master
        where type = 'table'
          and (
            name glob 'identity_*'
            or name glob 'tenancy_*'
          )
        order by name
      `.execute(database);

      expect(tableRows.rows.map(({ name }) => name)).toEqual([
        'identity_password_credentials',
        'identity_users',
        'tenancy_companies',
        'tenancy_memberships',
      ]);
      const schemaRows = await sql<{ name: string }>`
        pragma database_list
      `.execute(database);
      expect(schemaRows.rows.map(({ name }) => name)).toEqual(['main']);
    } finally {
      await database.destroy();
    }
  });

  it('upgrades a database containing only migration 0001', async () => {
    const temporaryFolder = await mkdtemp(
      join(resolve('packages/database'), '.tmp-migration-upgrade-'),
    );
    temporaryFolders.push(temporaryFolder);
    const firstMigration = `${MIGRATION_NAMES[0]}.mjs`;
    await copyFile(
      join(MIGRATION_FOLDER, firstMigration),
      join(temporaryFolder, firstMigration),
    );
    const { database, runner } = createSqliteRunner(temporaryFolder);

    try {
      await expect(runner.up()).resolves.toEqual(upExecutions([MIGRATION_NAMES[0]]));

      for (const migrationName of MIGRATION_NAMES.slice(1)) {
        const fileName = `${migrationName}.mjs`;
        await copyFile(
          join(MIGRATION_FOLDER, fileName),
          join(temporaryFolder, fileName),
        );
      }

      await expect(runner.up()).resolves.toEqual(
        upExecutions(MIGRATION_NAMES.slice(1)),
      );
      await expect(runner.verifyIntegrity()).resolves.toBeUndefined();
      await expect(
        database
          .selectFrom('mesachef_migration_checksum')
          .select(({ fn }) => fn.countAll<number>().as('count'))
          .executeTakeFirstOrThrow(),
      ).resolves.toEqual({ count: 6 });
    } finally {
      await database.destroy();
    }
  });

  it('enforces exact email uniqueness and credential one-to-one ownership', async () => {
    const { database, runner } = createSqliteRunner();

    try {
      await runner.up();
      await insertUser(database, USER_A, 'user@example.com');

      await expect(
        insertUser(database, USER_B, 'user@example.com'),
      ).rejects.toBeDefined();
      await insertUser(database, USER_B, 'User@example.com');

      await insertCredential(database, { userId: USER_A });
      await expect(
        insertCredential(database, { hash: 'duplicate', userId: USER_A }),
      ).rejects.toBeDefined();
      await expect(
        insertCredential(database, {
          userId: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
        }),
      ).rejects.toBeDefined();
      await expect(
        insertCredential(database, { hash: '   ', userId: USER_B }),
      ).rejects.toBeDefined();
      await expect(
        insertCredential(database, {
          hashAlgorithm: '',
          userId: USER_B,
        }),
      ).rejects.toBeDefined();
      await expect(
        insertCredential(database, {
          parametersVersion: 0,
          userId: USER_B,
        }),
      ).rejects.toBeDefined();
      await expect(
        insertCredential(database, { requiresChange: 2, userId: USER_B }),
      ).rejects.toBeDefined();
      await expect(
        insertCredential(database, {
          changedAt: 'not-a-timestamp',
          userId: USER_B,
        }),
      ).rejects.toBeDefined();
    } finally {
      await database.destroy();
    }
  });

  it('enforces membership relations, statuses, versions, timestamps and indexes', async () => {
    const { database, runner } = createSqliteRunner();

    try {
      await runner.up();
      await insertUser(database, USER_A, 'a@example.com');
      await insertUser(database, USER_B, 'b@example.com');
      await insertCompany(database, COMPANY_A, 'Company A');
      await insertCompany(database, COMPANY_B, 'Company B');

      await sql`
        insert into tenancy_memberships (
          id,
          user_id,
          company_id,
          status,
          authorization_version,
          created_at,
          updated_at
        ) values (
          ${MEMBERSHIP_A},
          ${USER_A},
          ${COMPANY_A},
          'ACTIVE',
          1,
          ${CREATED_AT},
          ${UPDATED_AT}
        )
      `.execute(database);
      await sql`
        insert into tenancy_memberships (
          id,
          user_id,
          company_id,
          status,
          authorization_version,
          created_at,
          updated_at
        ) values (
          ${MEMBERSHIP_B},
          ${USER_A},
          ${COMPANY_B},
          'INVITED',
          1,
          ${CREATED_AT},
          ${UPDATED_AT}
        )
      `.execute(database);

      await expect(sql`
        insert into tenancy_memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          ${USER_A},
          ${COMPANY_A},
          'ACTIVE',
          1,
          ${CREATED_AT},
          ${UPDATED_AT}
        )
      `.execute(database)).rejects.toBeDefined();
      await expect(sql`
        insert into tenancy_memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          'ffffffff-ffff-4fff-8fff-ffffffffffff',
          ${COMPANY_A},
          'ACTIVE',
          1,
          ${CREATED_AT},
          ${UPDATED_AT}
        )
      `.execute(database)).rejects.toBeDefined();
      await expect(sql`
        insert into tenancy_memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          ${USER_B},
          ${COMPANY_A},
          'UNKNOWN',
          1,
          ${CREATED_AT},
          ${UPDATED_AT}
        )
      `.execute(database)).rejects.toBeDefined();
      await expect(sql`
        insert into tenancy_memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          ${USER_B},
          ${COMPANY_A},
          'SUSPENDED',
          0,
          ${CREATED_AT},
          ${UPDATED_AT}
        )
      `.execute(database)).rejects.toBeDefined();
      await expect(sql`
        insert into tenancy_memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          ${USER_B},
          ${COMPANY_A},
          'REVOKED',
          1,
          ${UPDATED_AT},
          ${CREATED_AT}
        )
      `.execute(database)).rejects.toBeDefined();

      const indexRows = await sql<{ name: string; unique: number }>`
        pragma index_list('tenancy_memberships')
      `.execute(database);
      const indexDefinitions = await Promise.all(
        indexRows.rows.map(async (index) => {
          const columns = await sql<{ name: string; seqno: number }>`
            select name, seqno
            from pragma_index_info(${index.name})
            order by seqno
          `.execute(database);

          return {
            columns: columns.rows.map(({ name }) => name),
            isUnique: index.unique === 1,
            name: index.name,
          };
        }),
      );
      const findIndex = (columns: readonly string[]) =>
        indexDefinitions.find(
          (index) => index.columns.join(',') === columns.join(','),
        );

      expect(findIndex(['user_id', 'company_id'])?.isUnique).toBe(true);
      expect(findIndex(['company_id', 'id'])?.isUnique).toBe(true);
      expect(findIndex(['id', 'user_id', 'company_id'])?.isUnique).toBe(true);
      expect(findIndex(['user_id', 'status'])).toEqual({
        columns: ['user_id', 'status'],
        isUnique: false,
        name: 'tenancy_memberships_user_status_idx',
      });
      expect(findIndex(['company_id', 'status'])).toEqual({
        columns: ['company_id', 'status'],
        isUnique: false,
        name: 'tenancy_memberships_company_status_idx',
      });
    } finally {
      await database.destroy();
    }
  });

  it('rejects invalid UUID, UTC, status and blocked-state combinations', async () => {
    const { database, runner } = createSqliteRunner();

    try {
      await runner.up();
      await expect(sql`
        insert into identity_users (
          id, email_original, email_normalized, display_name, status,
          authorization_version, created_at, updated_at, blocked_at, blocked_reason
        ) values (
          'NOT-A-UUID', 'invalid@example.com', 'invalid@example.com', 'Invalid',
          'ACTIVE', 1, ${CREATED_AT}, ${UPDATED_AT}, null, null
        )
      `.execute(database)).rejects.toBeDefined();
      await expect(sql`
        insert into identity_users (
          id, email_original, email_normalized, display_name, status,
          authorization_version, created_at, updated_at, blocked_at, blocked_reason
        ) values (
          ${USER_A}, 'invalid@example.com', ' invalid@example.com ', 'Invalid',
          'ACTIVE', 1, ${CREATED_AT}, ${UPDATED_AT}, null, null
        )
      `.execute(database)).rejects.toBeDefined();
      await expect(sql`
        insert into identity_users (
          id, email_original, email_normalized, display_name, status,
          authorization_version, created_at, updated_at, blocked_at, blocked_reason
        ) values (
          ${USER_A}, 'invalid@example.com', 'invalid@example.com', 'Invalid',
          'ACTIVE', 1, 'not-a-timestamp', ${UPDATED_AT}, null, null
        )
      `.execute(database)).rejects.toBeDefined();
      await expect(sql`
        insert into identity_users (
          id, email_original, email_normalized, display_name, status,
          authorization_version, created_at, updated_at, blocked_at, blocked_reason
        ) values (
          ${USER_A}, 'blocked@example.com', 'blocked@example.com', 'Blocked',
          'BLOCKED', 1, ${CREATED_AT}, ${UPDATED_AT}, ${UPDATED_AT}, null
        )
      `.execute(database)).rejects.toBeDefined();
      await expect(sql`
        insert into tenancy_companies (
          id, name, status, authorization_version, created_at, updated_at,
          blocked_at, blocked_reason
        ) values (
          ${COMPANY_A}, 'Company', 'ACTIVE', 1, ${CREATED_AT}, ${UPDATED_AT},
          ${UPDATED_AT}, 'must be null while active'
        )
      `.execute(database)).rejects.toBeDefined();
    } finally {
      await database.destroy();
    }
  });

  it('refuses down with data and reverses every empty migration safely', async () => {
    const { database, runner } = createSqliteRunner();

    try {
      await runner.up();
      await insertUser(database, USER_A, 'a@example.com');
      await insertCompany(database, COMPANY_A, 'Company A');
      await sql`
        insert into tenancy_memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          ${MEMBERSHIP_A}, ${USER_A}, ${COMPANY_A}, 'ACTIVE', 1,
          ${CREATED_AT}, ${UPDATED_AT}
        )
      `.execute(database);

      await expect(runner.down()).rejects.toMatchObject({
        code: 'MIGRATION_EXECUTION_FAILED',
      });
      await expect(runner.verifyIntegrity()).resolves.toBeUndefined();
      await expect(sql<{ count: number }>`
        select count(*) as count from tenancy_memberships
      `.execute(database)).resolves.toMatchObject({ rows: [{ count: 1 }] });

      await sql`delete from tenancy_memberships`.execute(database);
      await sql`delete from tenancy_companies`.execute(database);
      await sql`delete from identity_users`.execute(database);

      for (const migrationName of [...MIGRATION_NAMES].reverse()) {
        await expect(runner.down()).resolves.toEqual([
          {
            direction: 'Down',
            name: migrationName,
            status: 'Success',
          },
        ]);
      }

      await expect(runner.status()).resolves.toEqual(pendingStatuses());
      const remainingBusinessTables = await sql<{ count: number }>`
        select count(*) as count
        from sqlite_master
        where type = 'table'
          and (
            name glob 'identity_*'
            or name glob 'tenancy_*'
          )
      `.execute(database);
      expect(remainingBusinessTables.rows[0]?.count).toBe(0);
    } finally {
      await database.destroy();
    }
  });

  it('fails closed when an applied migration artifact is edited', async () => {
    const temporaryFolder = await mkdtemp(
      join(resolve('packages/database'), '.tmp-migration-integrity-'),
    );
    temporaryFolders.push(temporaryFolder);
    const migrationFileName = `${MIGRATION_NAMES[0]}.mjs`;
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
