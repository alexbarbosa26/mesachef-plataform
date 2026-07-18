import { sql, type Kysely } from 'kysely';

import { connectionStringForRole, loadRlsSpikeConfig } from '../../src/config.js';
import {
  createTenantContext,
  type TenantContext,
} from '../../src/domain/context.js';
import { resourceIdFromString } from '../../src/domain/resource.js';
import {
  createPostgresDatabase,
  destroyPostgresDatabase,
  type PostgresDatabaseHandle,
} from '../../src/database/create-database.js';
import {
  dropExperimentalRoles,
  EXPERIMENTAL_ROLE_NAMES,
  provisionExperimentalRoles,
} from '../../src/database/roles.js';
import type { SpikeRlsDatabase } from '../../src/database/schema.js';
import {
  assertNoExperimentalTables,
  dropAllExperimentalTables,
  migrateRlsSchemaDown,
  migrateRlsSchemaUp,
} from '../../src/migrations/migrator.js';

export const TEST_IDS = Object.freeze({
  auditA: 'a1000000-0000-4000-8000-000000000001',
  auditB: 'b1000000-0000-4000-8000-000000000001',
  companyA: 'a0000000-0000-4000-8000-000000000001',
  companyB: 'b0000000-0000-4000-8000-000000000001',
  resourceA: 'a2000000-0000-4000-8000-000000000001',
  resourceB: 'b2000000-0000-4000-8000-000000000001',
});

export type PostgresRlsFixture = Readonly<{
  admin: PostgresDatabaseHandle;
  application: PostgresDatabaseHandle;
  contextA: TenantContext;
  contextB: TenantContext;
  dispose: () => Promise<void>;
  platform: PostgresDatabaseHandle;
}>;

async function seedExperimentalRows(
  database: Kysely<SpikeRlsDatabase>,
): Promise<void> {
  await database
    .insertInto('spike_rls_companies')
    .values([
      { id: TEST_IDS.companyA, name: 'Empresa experimental A' },
      { id: TEST_IDS.companyB, name: 'Empresa experimental B' },
    ])
    .execute();
  await database
    .insertInto('spike_rls_resources')
    .values([
      {
        company_id: TEST_IDS.companyA,
        id: TEST_IDS.resourceA,
        name: 'Recurso experimental A',
        resource_code: 'RESOURCE_A',
      },
      {
        company_id: TEST_IDS.companyB,
        id: TEST_IDS.resourceB,
        name: 'Recurso experimental B',
        resource_code: 'RESOURCE_B',
      },
    ])
    .execute();
  await database
    .insertInto('spike_rls_audit_events')
    .values([
      {
        company_id: TEST_IDS.companyA,
        event_type: 'seed.a',
        id: TEST_IDS.auditA,
      },
      {
        company_id: TEST_IDS.companyB,
        event_type: 'seed.b',
        id: TEST_IDS.auditB,
      },
    ])
    .execute();
}

async function assertNoExperimentalRoles(
  database: Kysely<SpikeRlsDatabase>,
): Promise<void> {
  const result = await sql<{ role_count: number }>`
    select count(*)::integer as role_count
    from pg_roles
    where rolname in (
      ${EXPERIMENTAL_ROLE_NAMES.application},
      ${EXPERIMENTAL_ROLE_NAMES.owner},
      ${EXPERIMENTAL_ROLE_NAMES.platform}
    )
  `.execute(database);

  if (result.rows[0]?.role_count !== 0) {
    throw new Error('A limpeza deixou roles experimentais no PostgreSQL local.');
  }
}

export async function createPostgresRlsFixture(
  options: Readonly<{ maxApplicationConnections?: number }> = {},
): Promise<PostgresRlsFixture> {
  const config = loadRlsSpikeConfig({
    SPIKE_RLS_ADMIN_DATABASE_URL:
      process.env['SPIKE_RLS_ADMIN_DATABASE_URL'],
  });
  const admin = createPostgresDatabase(config.adminConnectionString, {
    applicationName: 'mesachef-spike-rls-admin',
    maxConnections: 2,
  });
  let application: PostgresDatabaseHandle | undefined;
  let platform: PostgresDatabaseHandle | undefined;

  try {
    await dropAllExperimentalTables(admin.database);
    await dropExperimentalRoles(admin.database);

    const credentials = await provisionExperimentalRoles(admin.database);
    await migrateRlsSchemaUp(admin.database);
    await seedExperimentalRows(admin.database);

    application = createPostgresDatabase(
      connectionStringForRole(
        config.adminConnectionString,
        EXPERIMENTAL_ROLE_NAMES.application,
        credentials.applicationPassword,
      ),
      {
        applicationName: 'mesachef-spike-rls-tenant',
        maxConnections: options.maxApplicationConnections ?? 4,
      },
    );
    platform = createPostgresDatabase(
      connectionStringForRole(
        config.adminConnectionString,
        EXPERIMENTAL_ROLE_NAMES.platform,
        credentials.platformPassword,
      ),
      {
        applicationName: 'mesachef-spike-rls-platform',
        maxConnections: 2,
      },
    );

    const contextA = createTenantContext({
      actorId: 'spike-user-a',
      companyId: TEST_IDS.companyA,
      correlationId: 'spike-correlation-a',
    });
    const contextB = createTenantContext({
      actorId: 'spike-user-b',
      companyId: TEST_IDS.companyB,
      correlationId: 'spike-correlation-b',
    });

    const dispose = async (): Promise<void> => {
      await destroyPostgresDatabase(application);
      application = undefined;
      await destroyPostgresDatabase(platform);
      platform = undefined;

      let cleanupError: unknown;
      try {
        await migrateRlsSchemaDown(admin.database);
      } catch (error: unknown) {
        cleanupError = error;
      }

      try {
        await dropAllExperimentalTables(admin.database);
        await assertNoExperimentalTables(admin.database);
        await dropExperimentalRoles(admin.database);
        await assertNoExperimentalRoles(admin.database);
      } finally {
        await destroyPostgresDatabase(admin);
      }

      if (cleanupError !== undefined) {
        throw cleanupError;
      }
    };

    return {
      admin,
      application,
      contextA,
      contextB,
      dispose,
      platform,
    };
  } catch (error: unknown) {
    await destroyPostgresDatabase(application);
    await destroyPostgresDatabase(platform);
    await dropAllExperimentalTables(admin.database);
    await dropExperimentalRoles(admin.database);
    await destroyPostgresDatabase(admin);
    throw error;
  }
}

export const RESOURCE_IDS = Object.freeze({
  a: resourceIdFromString(TEST_IDS.resourceA),
  b: resourceIdFromString(TEST_IDS.resourceB),
  missing: resourceIdFromString('c2000000-0000-4000-8000-000000000001'),
});
