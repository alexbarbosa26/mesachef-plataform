import { sql, type Kysely } from 'kysely';
import type { Migration } from 'kysely/migration';

import { EXPERIMENTAL_ROLE_NAMES } from '../database/roles.js';
import type { SpikeRlsDatabase } from '../database/schema.js';

const CURRENT_COMPANY_EXPRESSION =
  "nullif(current_setting('app.current_company_id', true), '')::uuid";

async function up(database: Kysely<SpikeRlsDatabase>): Promise<void> {
  await database.schema
    .createTable('spike_rls_companies')
    .addColumn('id', 'uuid', (column) => column.primaryKey())
    .addColumn('name', 'text', (column) => column.notNull())
    .execute();

  await database.schema
    .createTable('spike_rls_resources')
    .addColumn('id', 'uuid', (column) => column.primaryKey())
    .addColumn('company_id', 'uuid', (column) => column.notNull())
    .addColumn('resource_code', 'text', (column) => column.notNull())
    .addColumn('name', 'text', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addForeignKeyConstraint(
      'spike_rls_resources_company_fk',
      ['company_id'],
      'spike_rls_companies',
      ['id'],
      (constraint) => constraint.onDelete('restrict'),
    )
    .addUniqueConstraint('spike_rls_resources_company_code_unique', [
      'company_id',
      'resource_code',
    ])
    .execute();

  await database.schema
    .createTable('spike_rls_audit_events')
    .addColumn('id', 'uuid', (column) => column.primaryKey())
    .addColumn('company_id', 'uuid', (column) => column.notNull())
    .addColumn('event_type', 'text', (column) => column.notNull())
    .addColumn('created_at', 'timestamptz', (column) =>
      column.notNull().defaultTo(sql`now()`),
    )
    .addForeignKeyConstraint(
      'spike_rls_audit_events_company_fk',
      ['company_id'],
      'spike_rls_companies',
      ['id'],
      (constraint) => constraint.onDelete('restrict'),
    )
    .execute();

  for (const tableName of [
    'spike_rls_resources',
    'spike_rls_audit_events',
  ] as const) {
    await sql.raw(`alter table ${tableName} enable row level security`).execute(
      database,
    );
    await sql.raw(`alter table ${tableName} force row level security`).execute(
      database,
    );
  }

  await sql.raw(`
    create policy spike_rls_resources_tenant_policy
      on spike_rls_resources
      for all
      to ${EXPERIMENTAL_ROLE_NAMES.application}
      using (company_id = ${CURRENT_COMPANY_EXPRESSION})
      with check (company_id = ${CURRENT_COMPANY_EXPRESSION})
  `).execute(database);

  await sql.raw(`
    create policy spike_rls_audit_events_tenant_policy
      on spike_rls_audit_events
      for all
      to ${EXPERIMENTAL_ROLE_NAMES.application}
      using (company_id = ${CURRENT_COMPANY_EXPRESSION})
      with check (company_id = ${CURRENT_COMPANY_EXPRESSION})
  `).execute(database);

  await sql.raw(`
    grant select, insert, update, delete
      on spike_rls_resources
      to ${EXPERIMENTAL_ROLE_NAMES.application}
  `).execute(database);
  await sql.raw(`
    grant select, insert
      on spike_rls_audit_events
      to ${EXPERIMENTAL_ROLE_NAMES.application}
  `).execute(database);
  await sql.raw(`
    grant select
      on spike_rls_companies
      to ${EXPERIMENTAL_ROLE_NAMES.platform}
  `).execute(database);

  for (const tableName of [
    'spike_rls_companies',
    'spike_rls_resources',
    'spike_rls_audit_events',
  ] as const) {
    await sql.raw(
      `alter table ${tableName} owner to ${EXPERIMENTAL_ROLE_NAMES.owner}`,
    ).execute(database);
  }
}

async function down(database: Kysely<SpikeRlsDatabase>): Promise<void> {
  await database.schema.dropTable('spike_rls_audit_events').ifExists().execute();
  await database.schema.dropTable('spike_rls_resources').ifExists().execute();
  await database.schema.dropTable('spike_rls_companies').ifExists().execute();
}

export const createRlsSchemaMigration: Migration = { down, up };
