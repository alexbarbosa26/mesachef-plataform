import { existsSync } from 'node:fs';
import { appendFile, copyFile, mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import { sql, type Kysely } from 'kysely';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { DatabaseConnectionConfig } from '../database-config.js';
import { createInfrastructureDatabase } from '../kysely/create-database.js';
import type { MigrationInfrastructureDatabase } from '../kysely/database-schema.js';
import { FileMigrationArtifactProvider } from './file-migration-artifact-provider.js';
import { MigrationRunner } from './migration-runner.js';

const LOCAL_POSTGRES_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);
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
const USER_C = '33333333-3333-4333-8333-333333333333';
const USER_D = '44444444-4444-4444-8444-444444444444';
const USER_E = '55555555-5555-4555-8555-555555555555';
const COMPANY_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const COMPANY_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const COMPANY_C = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const MEMBERSHIP_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const MEMBERSHIP_B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const MEMBERSHIP_C = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const MEMBERSHIP_D = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const CREATED_AT = '2030-01-02T03:04:05.678Z';
const UPDATED_AT = '2030-01-02T03:04:06.678Z';

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

function createRunner(
  database: Kysely<MigrationInfrastructureDatabase>,
  migrationFolder = MIGRATION_FOLDER,
): MigrationRunner {
  return new MigrationRunner({
    applicationVersion: '0.1.0-test',
    artifactProvider: new FileMigrationArtifactProvider({
      migrationFolder,
      provider: 'postgres',
    }),
    clock: () => new Date(CREATED_AT),
    database,
  });
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
  options: Readonly<{
    blockedAt?: string | null;
    blockedReason?: string | null;
    status?: string;
  }> = {},
): Promise<void> {
  await sql`
    insert into identity.users (
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
      ${id}::uuid,
      ${normalizedEmail},
      ${normalizedEmail},
      'Test User',
      ${options.status ?? 'ACTIVE'},
      1,
      ${CREATED_AT}::timestamptz,
      ${UPDATED_AT}::timestamptz,
      ${options.blockedAt ?? null}::timestamptz,
      ${options.blockedReason ?? null}
    )
  `.execute(database);
}

async function insertCompany(
  database: Kysely<MigrationInfrastructureDatabase>,
  id: string,
  name: string,
  options: Readonly<{
    blockedAt?: string | null;
    blockedReason?: string | null;
    status?: string;
  }> = {},
): Promise<void> {
  await sql`
    insert into tenancy.companies (
      id,
      name,
      status,
      authorization_version,
      created_at,
      updated_at,
      blocked_at,
      blocked_reason
    ) values (
      ${id}::uuid,
      ${name},
      ${options.status ?? 'ACTIVE'},
      1,
      ${CREATED_AT}::timestamptz,
      ${UPDATED_AT}::timestamptz,
      ${options.blockedAt ?? null}::timestamptz,
      ${options.blockedReason ?? null}
    )
  `.execute(database);
}

async function expectConstraintFailure(
  database: Kysely<MigrationInfrastructureDatabase>,
  operation: () => Promise<unknown>,
): Promise<void> {
  await sql`savepoint expected_constraint_failure`.execute(database);
  let failed = false;

  try {
    await operation();
  } catch {
    failed = true;
  }

  await sql`rollback to savepoint expected_constraint_failure`.execute(database);
  await sql`release savepoint expected_constraint_failure`.execute(database);
  expect(failed).toBe(true);
}

describe.sequential('PostgreSQL 14 identity and tenancy migrations', () => {
  const database = createInfrastructureDatabase(localPostgresConfiguration());
  const temporaryFolders: string[] = [];

  beforeAll(async () => {
    await sql`select 1`.execute(database);
  });

  afterAll(async () => {
    for (const folder of temporaryFolders) {
      await rm(folder, { force: true, recursive: true });
    }
    await database.destroy();
  });

  async function withRolledBackSchema(
    operation: (
      transaction: Kysely<MigrationInfrastructureDatabase>,
    ) => Promise<void>,
  ): Promise<void> {
    const rollbackSignal = new Error('ROLLBACK_POSTGRES_MIGRATION_TEST');
    let transactionResult: unknown;

    try {
      await database.transaction().execute(async (transaction) => {
        await operation(transaction);
        throw rollbackSignal;
      });
    } catch (error: unknown) {
      transactionResult = error;
    }

    const residualSchemas = await sql<{ count: string }>`
      select count(*)::text as count
      from information_schema.schemata
      where schema_name in ('identity', 'tenancy')
    `.execute(database);
    const residualTechnicalTables = await sql<{ count: string }>`
      select count(*)::text as count
      from pg_class relation
      join pg_namespace namespace on namespace.oid = relation.relnamespace
      where namespace.nspname = current_schema()
        and relation.relname in (
          'mesachef_kysely_migration',
          'mesachef_kysely_migration_lock',
          'mesachef_migration_checksum'
        )
    `.execute(database);

    expect(residualSchemas.rows[0]?.count).toBe('0');
    expect(residualTechnicalTables.rows[0]?.count).toBe('0');

    if (transactionResult !== rollbackSignal) {
      throw transactionResult ?? new Error('PostgreSQL migration test did not roll back.');
    }
  }

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

  it('migrates an empty database, records checksums and is idempotent', async () => {
    await withRolledBackSchema(async (transaction) => {
      const runner = createRunner(transaction);

      await expect(runner.up()).resolves.toEqual(upExecutions());
      await expect(runner.up()).resolves.toEqual([]);
      await expect(runner.verifyIntegrity()).resolves.toBeUndefined();

      const checksumRows = await transaction
        .selectFrom('mesachef_migration_checksum')
        .selectAll()
        .orderBy('migration_name')
        .execute();

      expect(checksumRows).toHaveLength(MIGRATION_NAMES.length);
      expect(checksumRows.map(({ migration_name }) => migration_name)).toEqual(
        MIGRATION_NAMES,
      );
      expect(
        checksumRows.every(
          ({ canonicalization_version }) =>
            canonicalization_version === 'v1',
        ),
      ).toBe(true);
    });
  });

  it('creates the approved PostgreSQL schemas, columns, constraints and indexes', async () => {
    await withRolledBackSchema(async (transaction) => {
      await createRunner(transaction).up();

      const schemaResult = await sql<{ schema_name: string }>`
        select schema_name
        from information_schema.schemata
        where schema_name in ('identity', 'tenancy')
        order by schema_name
      `.execute(transaction);
      expect(schemaResult.rows.map(({ schema_name }) => schema_name)).toEqual([
        'identity',
        'tenancy',
      ]);

      const tableResult = await sql<{
        table_name: string;
        table_schema: string;
      }>`
        select table_schema, table_name
        from information_schema.tables
        where table_schema in ('identity', 'tenancy')
          and table_type = 'BASE TABLE'
        order by table_schema, table_name
      `.execute(transaction);
      expect(tableResult.rows).toEqual([
        { table_name: 'password_credentials', table_schema: 'identity' },
        { table_name: 'users', table_schema: 'identity' },
        { table_name: 'companies', table_schema: 'tenancy' },
        { table_name: 'memberships', table_schema: 'tenancy' },
      ]);

      const columnResult = await sql<{
        collation_name: string | null;
        column_default: string | null;
        column_name: string;
        data_type: string;
        table_name: string;
        table_schema: string;
      }>`
        select
          table_schema,
          table_name,
          column_name,
          data_type,
          column_default,
          collation_name
        from information_schema.columns
        where (table_schema, table_name) in (
          ('identity', 'users'),
          ('identity', 'password_credentials'),
          ('tenancy', 'companies'),
          ('tenancy', 'memberships')
        )
        order by table_schema, table_name, ordinal_position
      `.execute(transaction);
      const columnNames = (tableSchema: string, tableName: string) =>
        columnResult.rows
          .filter(
            ({ table_name, table_schema }) =>
              table_schema === tableSchema && table_name === tableName,
          )
          .map(({ column_name }) => column_name);

      expect(columnNames('identity', 'users')).toEqual([
        'id',
        'email_original',
        'email_normalized',
        'display_name',
        'status',
        'authorization_version',
        'created_at',
        'updated_at',
        'blocked_at',
        'blocked_reason',
      ]);
      expect(columnNames('identity', 'password_credentials')).toEqual([
        'user_id',
        'password_hash',
        'hash_algorithm',
        'hash_parameters_version',
        'password_changed_at',
        'requires_password_change',
        'created_at',
        'updated_at',
      ]);
      expect(columnNames('tenancy', 'companies')).toEqual([
        'id',
        'name',
        'status',
        'authorization_version',
        'created_at',
        'updated_at',
        'blocked_at',
        'blocked_reason',
      ]);
      expect(columnNames('tenancy', 'memberships')).toEqual([
        'id',
        'user_id',
        'company_id',
        'status',
        'authorization_version',
        'created_at',
        'updated_at',
      ]);

      const byColumn = new Map(
        columnResult.rows.map((column) => [
          `${column.table_schema}.${column.table_name}.${column.column_name}`,
          column,
        ]),
      );
      expect(byColumn.get('identity.users.id')?.data_type).toBe('uuid');
      expect(byColumn.get('identity.users.created_at')?.data_type).toBe(
        'timestamp with time zone',
      );
      expect(
        byColumn.get('identity.password_credentials.requires_password_change')
          ?.data_type,
      ).toBe('boolean');
      expect(byColumn.get('identity.users.email_normalized')?.collation_name).toBe(
        'C',
      );
      expect(byColumn.get('identity.users.status')?.column_default).toBeNull();
      expect(
        byColumn.get('tenancy.memberships.authorization_version')?.data_type,
      ).toBe('integer');

      const constraintResult = await sql<{
        constraint_name: string;
        constraint_type: string;
        delete_action: string | null;
        update_action: string | null;
      }>`
        select
          tc.constraint_name,
          tc.constraint_type,
          rc.delete_rule as delete_action,
          rc.update_rule as update_action
        from information_schema.table_constraints tc
        left join information_schema.referential_constraints rc
          on rc.constraint_schema = tc.constraint_schema
          and rc.constraint_name = tc.constraint_name
        where tc.table_schema in ('identity', 'tenancy')
      `.execute(transaction);
      const constraintNames = new Set(
        constraintResult.rows.map(({ constraint_name }) => constraint_name),
      );

      for (const expectedConstraint of [
        'identity_users_email_normalized_unique',
        'identity_password_credentials_pkey',
        'identity_password_credentials_user_fk',
        'tenancy_memberships_user_company_unique',
        'tenancy_memberships_company_id_id_unique',
        'tenancy_memberships_id_user_company_unique',
      ]) {
        expect(constraintNames.has(expectedConstraint)).toBe(true);
      }
      const foreignKeys = constraintResult.rows.filter(
        ({ constraint_type }) => constraint_type === 'FOREIGN KEY',
      );
      expect(foreignKeys).toHaveLength(3);
      expect(
        foreignKeys.every(
          ({ delete_action, update_action }) =>
            delete_action === 'RESTRICT' && update_action === 'RESTRICT',
        ),
      ).toBe(true);

      const indexResult = await sql<{
        columns: string[];
        index_name: string;
        is_unique: boolean;
      }>`
        select
          index_relation.relname as index_name,
          index_definition.indisunique as is_unique,
          array_agg(attribute.attname::text order by key_column.ordinality) as columns
        from pg_index index_definition
        join pg_class table_relation
          on table_relation.oid = index_definition.indrelid
        join pg_namespace table_namespace
          on table_namespace.oid = table_relation.relnamespace
        join pg_class index_relation
          on index_relation.oid = index_definition.indexrelid
        cross join lateral unnest(index_definition.indkey)
          with ordinality as key_column(attribute_number, ordinality)
        join pg_attribute attribute
          on attribute.attrelid = table_relation.oid
          and attribute.attnum = key_column.attribute_number
        where table_namespace.nspname = 'tenancy'
          and table_relation.relname = 'memberships'
        group by index_relation.relname, index_definition.indisunique
      `.execute(transaction);
      const indexesByName = new Map(
        indexResult.rows.map((index) => [index.index_name, index]),
      );

      expect(indexesByName.get('tenancy_memberships_user_company_unique')).toEqual({
        columns: ['user_id', 'company_id'],
        index_name: 'tenancy_memberships_user_company_unique',
        is_unique: true,
      });
      expect(indexesByName.get('tenancy_memberships_company_id_id_unique')).toEqual({
        columns: ['company_id', 'id'],
        index_name: 'tenancy_memberships_company_id_id_unique',
        is_unique: true,
      });
      expect(indexesByName.get('tenancy_memberships_id_user_company_unique')).toEqual({
        columns: ['id', 'user_id', 'company_id'],
        index_name: 'tenancy_memberships_id_user_company_unique',
        is_unique: true,
      });
      expect(indexesByName.get('tenancy_memberships_user_status_idx')).toEqual({
        columns: ['user_id', 'status'],
        index_name: 'tenancy_memberships_user_status_idx',
        is_unique: false,
      });
      expect(indexesByName.get('tenancy_memberships_company_status_idx')).toEqual({
        columns: ['company_id', 'status'],
        index_name: 'tenancy_memberships_company_status_idx',
        is_unique: false,
      });

      const rlsResult = await sql<{
        relforcerowsecurity: boolean;
        relrowsecurity: boolean;
      }>`
        select relrowsecurity, relforcerowsecurity
        from pg_class
        where oid = 'tenancy.memberships'::regclass
      `.execute(transaction);
      expect(rlsResult.rows[0]).toEqual({
        relforcerowsecurity: false,
        relrowsecurity: false,
      });
    });
  });

  it('enforces email, credentials and many-to-many membership invariants', async () => {
    await withRolledBackSchema(async (transaction) => {
      await createRunner(transaction).up();
      await insertUser(transaction, USER_A, 'user@example.com');

      await expectConstraintFailure(transaction, () =>
        insertUser(transaction, USER_B, 'user@example.com'),
      );
      await insertUser(transaction, USER_B, 'User@example.com');
      await insertUser(transaction, USER_C, 'pending@example.com', {
        status: 'PENDING_ACTIVATION',
      });
      await insertUser(transaction, USER_D, 'blocked@example.com', {
        blockedAt: UPDATED_AT,
        blockedReason: 'Administrative block',
        status: 'BLOCKED',
      });
      await insertUser(transaction, USER_E, 'deactivated@example.com', {
        status: 'DEACTIVATED',
      });
      await insertCompany(transaction, COMPANY_A, 'Company A');
      await insertCompany(transaction, COMPANY_B, 'Company B');
      await insertCompany(transaction, COMPANY_C, 'Company C', {
        blockedAt: UPDATED_AT,
        blockedReason: 'Administrative block',
        status: 'BLOCKED',
      });

      await expectConstraintFailure(transaction, () =>
        insertUser(
          transaction,
          '66666666-6666-4666-8666-666666666666',
          'invalid-status@example.com',
          { status: 'UNKNOWN' },
        ),
      );
      await expectConstraintFailure(transaction, () =>
        insertCompany(
          transaction,
          'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          'Invalid Status Company',
          { status: 'UNKNOWN' },
        ),
      );

      await sql`
        insert into identity.password_credentials (
          user_id,
          password_hash,
          hash_algorithm,
          hash_parameters_version,
          password_changed_at,
          requires_password_change,
          created_at,
          updated_at
        ) values (
          ${USER_A}::uuid,
          'not-a-real-password-hash',
          'test-algorithm',
          1,
          ${UPDATED_AT}::timestamptz,
          false,
          ${CREATED_AT}::timestamptz,
          ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction);
      await expectConstraintFailure(transaction, () => sql`
        insert into identity.password_credentials (
          user_id, password_hash, hash_algorithm, hash_parameters_version,
          password_changed_at, requires_password_change, created_at, updated_at
        ) values (
          ${USER_A}::uuid, 'duplicate', 'test', 1,
          ${UPDATED_AT}::timestamptz, false,
          ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction));
      await expectConstraintFailure(transaction, () => sql`
        insert into identity.password_credentials (
          user_id, password_hash, hash_algorithm, hash_parameters_version,
          password_changed_at, requires_password_change, created_at, updated_at
        ) values (
          '77777777-7777-4777-8777-777777777777'::uuid,
          'orphan-placeholder', 'test', 1,
          ${UPDATED_AT}::timestamptz, false,
          ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction));

      await sql`
        insert into tenancy.memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          ${MEMBERSHIP_A}::uuid, ${USER_A}::uuid, ${COMPANY_A}::uuid,
          'ACTIVE', 1, ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction);
      await sql`
        insert into tenancy.memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          ${MEMBERSHIP_C}::uuid, ${USER_B}::uuid, ${COMPANY_A}::uuid,
          'SUSPENDED', 1, ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction);
      await sql`
        insert into tenancy.memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          ${MEMBERSHIP_D}::uuid, ${USER_B}::uuid, ${COMPANY_B}::uuid,
          'REVOKED', 1, ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction);

      await expectConstraintFailure(transaction, () => sql`
        insert into tenancy.memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          '00000000-0000-4000-8000-000000000001'::uuid,
          '77777777-7777-4777-8777-777777777777'::uuid,
          ${COMPANY_A}::uuid, 'ACTIVE', 1,
          ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction));
      await expectConstraintFailure(transaction, () => sql`
        insert into tenancy.memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          '00000000-0000-4000-8000-000000000002'::uuid,
          ${USER_A}::uuid, '77777777-7777-4777-8777-777777777777'::uuid,
          'ACTIVE', 1,
          ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction));
      await sql`
        insert into tenancy.memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          ${MEMBERSHIP_B}::uuid, ${USER_A}::uuid, ${COMPANY_B}::uuid,
          'INVITED', 1, ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction);

      await expectConstraintFailure(transaction, () => sql`
        insert into tenancy.memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          '00000000-0000-4000-8000-000000000003'::uuid,
          ${USER_A}::uuid, ${COMPANY_A}::uuid, 'ACTIVE', 1,
          ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction));
      await expectConstraintFailure(transaction, () => sql`
        insert into tenancy.memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          '00000000-0000-4000-8000-000000000004'::uuid,
          ${USER_B}::uuid, ${COMPANY_A}::uuid, 'UNKNOWN', 1,
          ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction));
      await expectConstraintFailure(transaction, () => sql`
        insert into tenancy.memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          '00000000-0000-4000-8000-000000000005'::uuid,
          ${USER_B}::uuid, ${COMPANY_A}::uuid, 'SUSPENDED', 0,
          ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction));
      await expectConstraintFailure(transaction, () => sql`
        insert into identity.users (
          id, email_original, email_normalized, display_name, status,
          authorization_version, created_at, updated_at, blocked_at, blocked_reason
        ) values (
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,
          'blocked@example.com', 'blocked@example.com', 'Blocked', 'BLOCKED', 1,
          ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz,
          ${UPDATED_AT}::timestamptz, null
        )
      `.execute(transaction));
      await expectConstraintFailure(transaction, () => sql`
        insert into tenancy.companies (
          id, name, status, authorization_version, created_at, updated_at,
          blocked_at, blocked_reason
        ) values (
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'::uuid,
          'Invalid Company', 'ACTIVE', 1,
          ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz,
          ${UPDATED_AT}::timestamptz, 'must be null while active'
        )
      `.execute(transaction));
    });
  });

  it('refuses destructive down with data and reverses empty migrations', async () => {
    await withRolledBackSchema(async (transaction) => {
      const runner = createRunner(transaction);
      await runner.up();
      await insertUser(transaction, USER_A, 'a@example.com');
      await insertCompany(transaction, COMPANY_A, 'Company A');
      await sql`
        insert into tenancy.memberships (
          id, user_id, company_id, status, authorization_version, created_at, updated_at
        ) values (
          ${MEMBERSHIP_A}::uuid, ${USER_A}::uuid, ${COMPANY_A}::uuid,
          'ACTIVE', 1, ${CREATED_AT}::timestamptz, ${UPDATED_AT}::timestamptz
        )
      `.execute(transaction);

      await expect(runner.down()).rejects.toMatchObject({
        code: 'MIGRATION_EXECUTION_FAILED',
      });
      await expect(runner.verifyIntegrity()).resolves.toBeUndefined();

      await sql`delete from tenancy.memberships`.execute(transaction);
      await sql`delete from tenancy.companies`.execute(transaction);
      await sql`delete from identity.users`.execute(transaction);

      for (const migrationName of [...MIGRATION_NAMES].reverse()) {
        await expect(runner.down()).resolves.toEqual([
          {
            direction: 'Down',
            name: migrationName,
            status: 'Success',
          },
        ]);
      }

      const schemaResult = await sql<{ count: string }>`
        select count(*)::text as count
        from information_schema.schemata
        where schema_name in ('identity', 'tenancy')
      `.execute(transaction);
      expect(schemaResult.rows[0]?.count).toBe('0');
    });
  });

  it('upgrades migration 0001 to the complete 002-A2 schema', async () => {
    const temporaryFolder = await mkdtemp(
      join(resolve('packages/database'), '.tmp-postgres-migration-upgrade-'),
    );
    temporaryFolders.push(temporaryFolder);
    const firstMigration = `${MIGRATION_NAMES[0]}.mjs`;
    await copyFile(
      join(MIGRATION_FOLDER, firstMigration),
      join(temporaryFolder, firstMigration),
    );

    await withRolledBackSchema(async (transaction) => {
      const runner = createRunner(transaction, temporaryFolder);
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
    });
  });

  it('blocks pending 002-A2 migrations when applied migration 0001 was edited', async () => {
    const temporaryFolder = await mkdtemp(
      join(resolve('packages/database'), '.tmp-postgres-migration-tamper-'),
    );
    temporaryFolders.push(temporaryFolder);
    const firstMigration = `${MIGRATION_NAMES[0]}.mjs`;
    const copiedFirstMigration = join(temporaryFolder, firstMigration);
    await copyFile(join(MIGRATION_FOLDER, firstMigration), copiedFirstMigration);

    await withRolledBackSchema(async (transaction) => {
      const runner = createRunner(transaction, temporaryFolder);
      await expect(runner.up()).resolves.toEqual(upExecutions([MIGRATION_NAMES[0]]));

      for (const migrationName of MIGRATION_NAMES.slice(1)) {
        const fileName = `${migrationName}.mjs`;
        await copyFile(
          join(MIGRATION_FOLDER, fileName),
          join(temporaryFolder, fileName),
        );
      }
      await appendFile(copiedFirstMigration, '\n// edited after application\n', 'utf8');

      await expect(runner.up()).rejects.toMatchObject({
        code: 'MIGRATION_INTEGRITY_FAILED',
      });
      const schemaResult = await sql<{ schema_name: string }>`
        select schema_name
        from information_schema.schemata
        where schema_name in ('identity', 'tenancy')
      `.execute(transaction);
      const nativeHistory = await transaction
        .selectFrom('mesachef_kysely_migration')
        .select('name')
        .execute();
      const checksumHistory = await transaction
        .selectFrom('mesachef_migration_checksum')
        .select('migration_name')
        .execute();

      expect(schemaResult.rows).toEqual([]);
      expect(nativeHistory).toEqual([{ name: MIGRATION_NAMES[0] }]);
      expect(checksumHistory).toEqual([
        { migration_name: MIGRATION_NAMES[0] },
      ]);
    });
  });
});
